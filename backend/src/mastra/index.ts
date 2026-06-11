import { Mastra } from '@mastra/core/mastra';
import { registerApiRoute } from '@mastra/core/server';
import { PinoLogger } from '@mastra/loggers';
import { chatRoute } from '@mastra/ai-sdk';
import { LibSQLStore } from '@mastra/libsql';
import { PgVector } from '@mastra/pg';
import {
  Observability,
  DefaultExporter,
  CloudExporter,
  SensitiveDataFilter,
} from '@mastra/observability';

import {
  handleCvChatRoute,
  handleUploadCvRoute,
  handleCreatePrepSessionRoute,
  handleGetPrepSessionByIdRoute,
  handleListPrepSessionsRoute,
  handlePracticeSessionChatRoute,
} from './routes';

import { cvAnalyserAgent } from './agents/cv-analyser';
import { jdScorerTool } from './tools/jd-scorer-tool';
import { interviewPrepWorkflow } from './workflows/interview-prep';
import { practiceInterviewAgent } from './agents/practice-interview-agent';
import { cvRewriterAgent } from './agents/cv-rewriter';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const DATABASE_URL = process.env.DATABASE_URL;
const MASTRA_DB_URL = process.env.MASTRA_DB_URL ?? 'file:./mastra.db';

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

// ── Mastra instance ───────────────────────────────────────────────────────────

export const mastra = new Mastra({
  bundler: {
    externals: [
      '@prisma/client',
      '.prisma/client',
      '@prisma/adapter-pg',
      'pg',
    ],
  },
  agents: {
    cvAnalyserAgent,
    practiceInterviewAgent,
    cvRewriterAgent,
  },

  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: MASTRA_DB_URL,
  }),

  vectors: {
    pgVector: new PgVector({
      id: 'pgVector',
      connectionString: DATABASE_URL!,
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
      origin: FRONTEND_URL,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
    },

    apiRoutes: [
      chatRoute({ path: '/chat/:agentId' }),

      registerApiRoute('/custom/debug-cv', {
        method: 'POST',
        handler: async (c) => {
          const mastra = c.get('mastra');
          const body = await c.req.json();
          const userId = body?.userId ?? 'default-user';
          const vectorStore = mastra.getVector('pgVector');

          const results = await vectorStore.query({
            indexName: 'cv_embeddings',
            queryVector: new Array(1536).fill(0),
            topK: 5,
            filter: { userId },
            includeVector: false,
          });

          return c.json({ userId, chunks: results.map((r: any) => r.metadata) });
        },
      }),

      registerApiRoute('/custom/chat/cv', {
        method: 'POST',
        handler: handleCvChatRoute,
      }),

      registerApiRoute('/custom/prep-session', {
        method: 'POST',
        handler: handleCreatePrepSessionRoute,
      }),

      registerApiRoute('/custom/prep-session/:id', {
        method: 'GET',
        handler: handleGetPrepSessionByIdRoute,
      }),

      registerApiRoute('/custom/prep-session', {
        method: 'GET',
        handler: handleListPrepSessionsRoute,
      }),

      registerApiRoute('/custom/practice-session/:sessionId/chat', {
        method: 'POST',
        handler: handlePracticeSessionChatRoute,
      }),

      registerApiRoute('/custom/upload-cv', {
        method: 'POST',
        handler: handleUploadCvRoute,
        requiresAuth: false,
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

