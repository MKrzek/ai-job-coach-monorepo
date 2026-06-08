import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mastra } from '../../mastra/index.js';
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

// inline handler extracted for testability — matches the debug-cv route in index.ts
async function handleDebugCvRoute(c: any) {
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
}

describe('handleDebugCvRoute', () => {
  const { mockQuery } = getMastraTestMocks();

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockResolvedValue([]);
  });

  it('queries with the provided userId', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const { c } = createMockContext({ userId: 'user-test-1' });

    await handleDebugCvRoute(c as any);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        indexName: 'cv_embeddings',
        topK: 5,
        filter: { userId: 'user-test-1' },
        includeVector: false,
      })
    );
  });

  it('defaults userId to default-user when omitted', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const { c } = createMockContext({});

    await handleDebugCvRoute(c as any);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { userId: 'default-user' },
      })
    );
  });

  it('returns userId and mapped chunk metadata', async () => {
    mockQuery.mockResolvedValueOnce([
      { id: 'v1', metadata: { text: 'Built React apps', chunkIndex: 0 } },
      { id: 'v2', metadata: { text: 'Designed APIs', chunkIndex: 1 } },
    ]);

    const { c } = createMockContext({ userId: 'user-test-1' });

    const result = await handleDebugCvRoute(c as any);

    expect(result.status).toBe(200);
    expect(result.data).toEqual({
      userId: 'user-test-1',
      chunks: [
        { text: 'Built React apps', chunkIndex: 0 },
        { text: 'Designed APIs', chunkIndex: 1 },
      ],
    });
  });

  it('returns empty chunks array when no vectors found', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const { c } = createMockContext({ userId: 'user-test-1' });

    const result = await handleDebugCvRoute(c as any);

    expect(result.status).toBe(200);
    expect(result.data).toEqual({
      userId: 'user-test-1',
      chunks: [],
    });
  });

  it('uses queryVector of 1536 zeros', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const { c } = createMockContext({ userId: 'user-test-1' });

    await handleDebugCvRoute(c as any);

    const callArg = mockQuery.mock.calls[0][0];
    expect(callArg.queryVector).toHaveLength(1536);
    expect(callArg.queryVector.every((v: number) => v === 0)).toBe(true);
  });
});