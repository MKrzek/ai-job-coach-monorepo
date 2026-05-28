import { Mastra } from '@mastra/core/mastra';
import { registerApiRoute } from '@mastra/core/server';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { PinoLogger } from '@mastra/loggers';
import { chatRoute, toAISdkStream } from '@mastra/ai-sdk';
import { LibSQLStore } from '@mastra/libsql';
import { PgVector } from '@mastra/pg';
import { MDocument } from '@mastra/rag';
import {
  Observability,
  DefaultExporter,
  CloudExporter,
  SensitiveDataFilter,
} from '@mastra/observability';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  embedMany,
} from 'ai';

import { cvAnalyserAgent } from './agents/cv-analyser';
import { jdScorerTool } from './tools/jd-scorer-tool';
import { interviewPrepWorkflow } from './workflows/interview-prep';
import { prisma } from '../lib/prisma';
import { practiceInterviewAgent } from './agents/practice-interview-agent';
import { cvRewriterAgent } from './agents/cv-rewriter';

export const mastra = new Mastra({
  agents: {
    cvAnalyserAgent,
    practiceInterviewAgent,
    cvRewriterAgent
  },

  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: 'file:./mastra.db',
  }),

  vectors: {
    pgVector: new PgVector({
      id: 'pgVector',
      connectionString: process.env.DATABASE_URL!,
    }),
  },

  workflows: {
    interviewPrepWorkflow,
  },

  tools: {
    jdScorerTool,
  },

  server: {
    cors: {
      origin: 'http://localhost:5173',
      allowMethods: ['GET', 'POST'],
    },

    apiRoutes: [
      chatRoute({ path: '/chat/:agentId' }),


      registerApiRoute('/api/chat/cv', {
        method: 'POST',
        handler: async (c) => {
          try {
            const mastra = c.get('mastra');
            const body = await c.req.json();

            const messages = body?.messages ?? [];
            const userId = body?.userId ?? 'default-user';
            const threadId = body?.threadId ?? `${userId}-cv-thread`;
            const latestText = typeof body?.latestText === 'string' ? body.latestText : '';

            if (!Array.isArray(messages) || messages.length === 0) {
              return c.json({ error: 'messages is required' }, 400);
            }

            const rewriteKeywords = [
              'rewrite',
              'tailor',
              'improve',
              'rephrase',
              'revise',
              'reword',
              'bullet point',
              'bullet points',
              'update my cv',
              'update my bullet',
              'rewrite my cv',
              'tailor my cv',
            ];

            const lower = latestText.toLowerCase();

            const intent = rewriteKeywords.some((keyword) => lower.includes(keyword))
              ? 'rewrite'
              : 'analyse';

            console.log('[cv-chat] latestText:', latestText);
            console.log('[cv-chat] Determined intent:', intent);

            const agent = mastra.getAgent(
              intent === 'rewrite' ? 'cvRewriterAgent' : 'cvAnalyserAgent'
            );

            console.log('[cv-chat] selected agent:', agent, intent);

            const agentStream = await agent.stream(messages, {
              memory: {
                resource: userId,
                thread: threadId,
              },
            });

            const uiMessageStream = createUIMessageStream({
              originalMessages: messages,
              execute: async ({ writer }) => {
                for await (const part of toAISdkStream(agentStream, {
                  from: 'agent',
                  version: 'v6',
                })) {
                  await writer.write(part);
                }
              },
            });

            return createUIMessageStreamResponse({
              stream: uiMessageStream,
              headers: {
                'X-Agent-Used': intent,
                'X-Thread-Id': threadId,
              },
            });
          } catch (err) {
            console.error('CV chat error:', err);
            return c.json({ error: String(err) }, 500);
          }
        },
      }),

      registerApiRoute('/api/prep-session', {
        method: 'POST',
        handler: async (c) => {
          const mastra = c.get('mastra');
          const body = await c.req.json();
          const { jobDescription } = body;

          if (!jobDescription?.trim()) {
            return c.json({ error: 'jobDescription is required' }, 400);
          }

          try {
            const workflow = mastra.getWorkflow('interviewPrepWorkflow');
            const run = await workflow.createRun();
            const result = await run.start({
              inputData: { jobDescription },
            });

            if (result.status !== 'success' || !result.result?.answers?.length) {
              return c.json({ error: 'Workflow returned no answers' }, 500);
            }

            const session = await prisma.prepSession.create({
              data: {
                jobDescription,
                roleTitle: 'Unknown Role',
                answers: {
                  create: result.result.answers.map((a: any) => ({
                    question: a.question,
                    type: a.type,
                    modelAnswer: a.modelAnswer,
                    keyPoints: a.keyPoints,
                  })),
                },
              },
              include: { answers: true },
            });

            return c.json(session, 201);
          } catch (err) {
            console.error('prep-session error:', err);
            return c.json({ error: 'Failed to run workflow' }, 500);
          }
        },
      }),

      registerApiRoute('/api/prep-session/:id', {
        method: 'GET',
        handler: async (c) => {
          const session = await prisma.prepSession.findUnique({
            where: { id: c.req.param('id') },
            include: { answers: true },
          });

          if (!session) {
            return c.json({ error: 'Session not found' }, 404);
          }

          return c.json(session);
        },
      }),

      registerApiRoute('/api/prep-session', {
        method: 'GET',
        handler: async (c) => {
          const sessions = await prisma.prepSession.findMany({
            orderBy: { createdAt: 'desc' },
            include: { answers: true },
          });

          return c.json(sessions);
        },
      }),

      registerApiRoute('/api/practice-session/:sessionId/chat', {
        method: 'POST',
        handler: async (c) => {
          try {
            const mastra = c.get('mastra');
            const sessionId = c.req.param('sessionId');
            const { messages } = await c.req.json();

            if (!messages?.length) {
              return c.json({ error: 'messages is required' }, 400);
            }

            const session = await prisma.prepSession.findUnique({
              where: { id: sessionId },
              select: { jobDescription: true },
            });

            const jd = session?.jobDescription;
            const agent = mastra.getAgent('practiceInterviewAgent');

            const agentStream = await agent.stream(messages, {
              memory: {
                resource: sessionId,
                thread: sessionId,
              },
              instructions: jd
                ? `You are interviewing a candidate for the following role:\n\n${jd}\n\nAsk ONE question at a time. Give brief feedback after each answer. Never repeat a question. After 5 questions give an overall summary with a score out of 10.`
                : undefined,
            });

            const uiMessageStream = createUIMessageStream({
              originalMessages: messages,
              execute: async ({ writer }) => {
                for await (const part of toAISdkStream(agentStream, {
                  from: 'agent',
                  version: 'v6',
                })) {
                  await writer.write(part);
                }
              },
            });

            return createUIMessageStreamResponse({
              stream: uiMessageStream,
            });
          } catch (err) {
            console.error('Practice session chat error:', err);
            return c.json({ error: String(err) }, 500);
          }
        },
      }),

      registerApiRoute('/api/upload-cv', {
        method: 'POST',
        handler: async (c) => {
          try {
            const mastra = c.get('mastra');
            const body = await c.req.json();
            const cvText = body?.cvText?.trim();
            const userId = body?.userId ?? 'default-user';

            if (!cvText) {
              return c.json({ error: 'cvText is required' }, 400);
            }

            const doc = MDocument.fromText(cvText);

            const chunks = await doc.chunk({
              strategy: 'recursive',
              maxSize: 512,
              overlap: 50,
            });

            const { embeddings } = await embedMany({
              model: new ModelRouterEmbeddingModel('openai/text-embedding-3-small'),
              values: chunks.map((chunk) => chunk.text),
            });

            const vectorStore = mastra.getVector('pgVector');

            await vectorStore.upsert({
              indexName: 'cv_embeddings',
              vectors: embeddings,
              metadata: chunks.map((chunk, index) => ({
                userId,
                text: chunk.text,
                source: 'cv',
                chunkIndex: index,
              })),
            });

            return c.json({
              success: true,
              chunkCount: chunks.length,
            });
          } catch (err) {
            console.error('upload-cv error:', err);
            return c.json({ error: String(err) }, 500);
          }
        },
      }),
    ],
  },

  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),

  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [new DefaultExporter(), new CloudExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
