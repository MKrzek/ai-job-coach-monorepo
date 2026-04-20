
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { chatRoute } from '@mastra/ai-sdk';

import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';

import { cvAnalyserAgent } from './agents/cv-analyser';
import { jdScorerTool } from './tools/jd-scorer-tool';
import { interviewPrepWorkflow } from './workflows/interview-prep';


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
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
