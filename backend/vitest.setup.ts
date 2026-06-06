// vitest.setup.ts
import { vi } from 'vitest';

const globalMocks = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockUpsert: vi.fn(),
  mockCreateIndex: vi.fn(),
  mockDeleteIndex: vi.fn(),
  mockDescribeIndex: vi.fn(),
  mockDeleteByFilter: vi.fn(),
  mockSetLogger: vi.fn(),
}));

// Make available to tests
// eslint-disable-next-line no-var
declare var __mastraTestMocks__: typeof globalMocks;

(globalThis as any).__mastraTestMocks__ = globalMocks;

vi.mock('ai', () => ({
  embed: vi.fn().mockResolvedValue({
    embedding: new Array(1536).fill(0.1),
  }),
}));

vi.mock('@mastra/pg', () => {
  const PgVector = vi.fn(
    class {
      query = globalMocks.mockQuery;
      upsert = globalMocks.mockUpsert;
      createIndex = globalMocks.mockCreateIndex;
      deleteIndex = globalMocks.mockDeleteIndex;
      describeIndex = globalMocks.mockDescribeIndex;
      deleteByFilter = globalMocks.mockDeleteByFilter;
      __setLogger = globalMocks.mockSetLogger;

      constructor(_config: unknown) { }
    }
  );

  return { PgVector };
});

vi.mock('@mastra/core/llm', () => {
  const ModelRouterEmbeddingModel = vi.fn(
    class {
      constructor(_modelId: string) { }
    }
  );

  return { ModelRouterEmbeddingModel };
});

// After globalMocks definition
// eslint-disable-next-line no-var
declare var __mastraTestMocks__: typeof globalMocks;

(globalThis as any).__mastraTestMocks__ = globalMocks;