// test/utils/mastra-test-mocks.ts
import { vi } from 'vitest';

type MockFn = ReturnType<typeof vi.fn>;

type MastraTestMocks = {
  mockQuery: MockFn;
  mockUpsert: MockFn;
  mockCreateIndex: MockFn;
  mockDeleteIndex: MockFn;
  mockDescribeIndex: MockFn;
  mockDeleteByFilter: MockFn;
  mockSetLogger: MockFn;
};

declare global {
  // eslint-disable-next-line no-var
  var __mastraTestMocks__: MastraTestMocks | undefined;
}

export function getMastraTestMocks(): MastraTestMocks {
  if (!globalThis.__mastraTestMocks__) {
    throw new Error('Mastra test mocks have not been initialized.');
  }
  return globalThis.__mastraTestMocks__;
}
