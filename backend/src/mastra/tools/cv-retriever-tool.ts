import { createTool } from '@mastra/core/tools';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { embed } from 'ai';
import { z } from 'zod';
import { PgVector } from '@mastra/pg';

const vectorStore = new PgVector({
  id: 'pgVector',
  connectionString: process.env.DATABASE_URL!,
});

export const cvRetrieverTool = createTool({
  id: 'cv-retriever',
  description:
    'Retrieves the most relevant parts of a user CV for a given job description or query.',

  inputSchema: z.object({
    query: z
      .string()
      .describe('The job description or search query to match against the CV'),
    userId: z
      .string()
      .optional()
      .describe('The user id used to scope the vector search'),
    topK: z
      .number()
      .optional()
      .default(4)
      .describe('How many CV chunks to retrieve'),
  }),

  execute: async ({ query, userId, topK }) => {
    const effectiveUserId = userId ?? 'default-user';

    const { embedding } = await embed({
      model: new ModelRouterEmbeddingModel('openai/text-embedding-3-small'),
      value: query,
    });

    const results = await vectorStore.query({
      indexName: 'cv_embeddings',
      queryVector: embedding,
      topK,
      filter: {
        userId: effectiveUserId,
      },
    });

    if (!results?.length) {
      return {
        matches: [],
        combinedText: 'No relevant CV content found.',
      };
    }

    const matches = results.map((result: any, index: number) => ({
      rank: index + 1,
      score: result.score ?? null,
      text: result.metadata?.text ?? '',
      chunkIndex: result.metadata?.chunkIndex ?? null,
      source: result.metadata?.source ?? 'cv',
    }));

    return {
      matches,
      combinedText: matches
        .map((match) => match.text)
        .filter(Boolean)
        .join('\n\n'),
    };
  },
});
