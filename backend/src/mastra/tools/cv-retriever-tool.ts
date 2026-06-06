import { createTool } from '@mastra/core/tools';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { embed } from 'ai';
import { z } from 'zod';
import { PgVector } from '@mastra/pg';

const vectorStore = new PgVector({
  id: 'pgVector',
  connectionString: process.env.DATABASE_URL!,
});

export const cvRetrieverInputSchema = z.object({
  query: z
    .string()
    .describe(
      'The job requirement or search query to match against the CV. Use focused, specific terms.'
    ),
  userId: z
    .string()
    .optional()
    .describe('The user id used to scope the vector search'),
  topK: z
    .number()
    .default(15)
    .describe('How many CV chunks to retrieve. Default is 15 to ensure broad coverage.'),
});

export type CvRetrieverInput = z.input<typeof cvRetrieverInputSchema>;

export type CvRetrieverMatch = {
  rank: number;
  score: number | null;
  text: string;
  chunkIndex: number | null;
  source: string;
};

export type CvRetrieverResult = {
  matches: CvRetrieverMatch[];
  combinedText: string;
};

type VectorResult = {
  id?: string;
  score?: number;
  metadata?: {
    text?: string;
    chunkIndex?: number;
    source?: string;
    userId?: string;
  };
};

export async function runCvRetriever(
  input: CvRetrieverInput
): Promise<CvRetrieverResult> {
  const effectiveUserId = input.userId ?? 'default-user';
  const effectiveTopK = input.topK ?? 15;

  const { embedding } = await embed({
    model: new ModelRouterEmbeddingModel('openai/text-embedding-3-small'),
    value: input.query,
  });

  const rawResults = await vectorStore.query({
    indexName: 'cv_embeddings',
    queryVector: embedding,
    topK: effectiveTopK,
    filter: {
      userId: effectiveUserId,
    },
  });

  const results = (rawResults ?? []) as VectorResult[];

  if (!results.length) {
    return {
      matches: [],
      combinedText: 'No relevant CV content found.',
    };
  }

  const matches: CvRetrieverMatch[] = results.map((result, index) => ({
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
}

export const cvRetrieverTool = createTool({
  id: 'cv-retriever',
  description:
    'Retrieves the most relevant parts of a user CV for a given job description or query. ' +
    'Call this tool multiple times with different focused queries to ensure full CV coverage. ' +
    'For example: query once for "testing jest cypress playwright", once for "redis caching performance", ' +
    'once for "CI/CD docker github actions", once for "accessibility WCAG compliance". ' +
    'Do not rely on a single broad query — targeted queries return more accurate chunks.',
  inputSchema: cvRetrieverInputSchema,
  execute: async (input) => runCvRetriever(input),
});
