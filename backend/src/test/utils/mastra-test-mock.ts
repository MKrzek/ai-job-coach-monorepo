import { vi } from 'vitest';
import { mastra } from '../../mastra/index.js';

export type MastraTestMocks = {
  mockQuery: ReturnType<typeof vi.fn>;
  mockUpsert: ReturnType<typeof vi.fn>;
  mockDeleteVectors: ReturnType<typeof vi.fn>;
};

const mockQuery = vi.fn();
const mockUpsert = vi.fn();
const mockDeleteVectors = vi.fn();

const mockVectorStore = {
  query: mockQuery,
  upsert: mockUpsert,
  deleteVectors: mockDeleteVectors,
};

vi.spyOn(mastra, 'getVector').mockReturnValue(mockVectorStore as any);

export function getMastraTestMocks(): MastraTestMocks {
  return {
    mockQuery,
    mockUpsert,
    mockDeleteVectors,
  };
}