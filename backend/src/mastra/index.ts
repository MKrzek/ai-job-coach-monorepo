import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { chatRoute } from '@mastra/ai-sdk';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';

import { cvAnalyserAgent } from './agents/cv-analyser';
import { jdScorerTool } from './tools/jd-scorer-tool';
import { interviewPrepWorkflow } from './workflows/interview-prep';
import { prisma } from '../lib/prisma';

export const mastra = new Mastra({
  agents: {
    cvAnalyserAgent,
  },
  workflows: { interviewPrepWorkflow },
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

      // POST /api/prep-session
      {
        path: '/api/prep-session',
        method: 'POST',
        createHandler: async ({ mastra }) => async (c) => {
          const body = await c.req.json()
          const { jobDescription } = body

          if (!jobDescription?.trim()) {
            return c.json({ error: 'jobDescription is required' }, 400)
          }

          try {
            const workflow = mastra.getWorkflow('interviewPrepWorkflow')
            const run = await workflow.createRun()
            const result = await run.start({ inputData: { jobDescription } })

            if (result.status !== 'success' || !result.result?.answers?.length) {
              return c.json({ error: 'Workflow returned no answers' }, 500)
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
            })

            return c.json(session, 201)

          } catch (err) {
            console.error('prep-session error:', err)
            return c.json({ error: 'Failed to run workflow' }, 500)
          }
        },
      },

      // GET /api/prep-session/:id
      {
        path: '/api/prep-session/:id',
        method: 'GET',
        createHandler: async ({ mastra: _ }) => async (c) => {
          const session = await prisma.prepSession.findUnique({
            where: { id: c.req.param('id') },
            include: { answers: true },
          })

          if (!session) return c.json({ error: 'Session not found' }, 404)
          return c.json(session)
        },
      },

      // GET /api/prep-session
      {
        path: '/api/prep-session',
        method: 'GET',
        createHandler: async ({ mastra: _ }) => async (c) => {
          const sessions = await prisma.prepSession.findMany({
            orderBy: { createdAt: 'desc' },
            include: { answers: true },
          })
          return c.json(sessions)
        },
      },
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
        exporters: [
          new DefaultExporter(),
          new CloudExporter(),
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(),
        ],
      },
    },
  }),
});
