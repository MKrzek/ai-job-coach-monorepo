import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();

  return {
    ...actual,
    embedMany: vi.fn().mockResolvedValue({
      embeddings: [
        new Array(1536).fill(0.01),
        new Array(1536).fill(0.02),
      ],
    }),
  };
});

import { handleUploadCvRoute, mastra } from '../../mastra/index.js';
import { getMastraTestMocks } from '../../test/utils/mastra-test-mock.js';

function createMockContext(body: unknown) {
  const json = vi.fn((data: any, status = 200) => ({ data, status }));

  return {
    c: {
      get: vi.fn((key: string) => {
        if (key === 'mastra') return mastra;
        throw new Error(`Unexpected key: ${key}`);
      }),
      req: {
        json: vi.fn().mockResolvedValue(body),
      },
      json,
    },
    json,
  };
}

describe('handleUploadCvRoute', () => {
  const mocks = getMastraTestMocks();
  const mockQuery = mocks.mockQuery;
  const mockUpsert = mocks.mockUpsert;
  const mockDeleteVectors = mocks.mockDeleteVectors;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQuery.mockResolvedValue([]);
    mockUpsert.mockResolvedValue(undefined);

    if (mockDeleteVectors) {
      mockDeleteVectors.mockResolvedValue(undefined);
    }
  });

  it('returns 400 when cvText is missing', async () => {
    const { c, json } = createMockContext({ userId: 'user-test-1' });

    const result = await handleUploadCvRoute(c as any);

    expect(result.status).toBe(400);
    expect(json).toHaveBeenCalledWith({ error: 'cvText is required' }, 400);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('queries existing vectors and upserts chunks with expected metadata', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const { c } = createMockContext({
      cvText: 'Built React apps with TypeScript.\nDesigned Node APIs.',
      userId: 'user-test-1',
    });

    const result = await handleUploadCvRoute(c as any);

    expect(result.status).toBe(200);
    expect(result.data).toEqual(
      expect.objectContaining({
        success: true,
        chunkCount: expect.any(Number),
      })
    );

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        indexName: 'cv_embeddings',
        topK: 1000,
        filter: { userId: 'user-test-1' },
        includeVector: false,
      })
    );

    expect(mockUpsert).toHaveBeenCalledTimes(1);

    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg).toEqual(
      expect.objectContaining({
        indexName: 'cv_embeddings',
        vectors: expect.any(Array),
        metadata: expect.any(Array),
      })
    );

    expect(upsertArg.metadata.length).toBe(result.data.chunkCount);
    expect(upsertArg.metadata[0]).toEqual(
      expect.objectContaining({
        userId: 'user-test-1',
        source: 'cv',
        chunkIndex: 0,
        text: expect.any(String),
      })
    );
  });

  it('defaults userId to default-user when omitted', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const { c } = createMockContext({
      cvText: 'Anonymous CV text',
    });

    const result = await handleUploadCvRoute(c as any);

    expect(result.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { userId: 'default-user' },
      })
    );

    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.metadata[0]).toEqual(
      expect.objectContaining({
        userId: 'default-user',
      })
    );
  });

  it('deletes existing vectors when query returns ids', async () => {
    mockQuery.mockResolvedValueOnce([
      { id: 'vec-1', metadata: {} },
      { id: 'vec-2', metadata: {} },
      { id: undefined, metadata: {} },
    ]);

    const { c } = createMockContext({
      cvText: 'Built React apps with TypeScript.',
      userId: 'user-test-1',
    });

    const result = await handleUploadCvRoute(c as any);

    expect(result.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    if (mockDeleteVectors) {
      expect(mockDeleteVectors).toHaveBeenCalledTimes(1);
      expect(mockDeleteVectors).toHaveBeenCalledWith({
        indexName: 'cv_embeddings',
        ids: ['vec-1', 'vec-2'],
      });
    }
  });

  it('still upserts when clearing existing chunks fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('query failed'));

    const { c } = createMockContext({
      cvText: 'Built React apps with TypeScript.',
      userId: 'user-test-1',
    });

    const result = await handleUploadCvRoute(c as any);

    expect(result.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    if (mockDeleteVectors) {
      expect(mockDeleteVectors).not.toHaveBeenCalled();
    }
  });

  it('returns 500 when upsert fails', async () => {
    mockQuery.mockResolvedValueOnce([]);
    mockUpsert.mockRejectedValueOnce(new Error('upsert failed'));

    const { c } = createMockContext({
      cvText: 'Built React apps with TypeScript.',
      userId: 'user-test-1',
    });

    const result = await handleUploadCvRoute(c as any);

    expect(result.status).toBe(500);
    expect(result.data).toEqual({
      error: 'Error: upsert failed',
    });
  });
});
