import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    prepSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: mockFindMany,
    },
  },
}));

import { handleListPrepSessionsRoute } from '../../mastra/index.js';

function createMockContext() {
  const json = vi.fn((data: any, status = 200) => ({ data, status }));

  return {
    c: { json },
    json,
  };
}

describe('handleListPrepSessionsRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns sessions ordered by createdAt desc', async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: 'session-2', createdAt: '2026-06-08', answers: [] },
      { id: 'session-1', createdAt: '2026-06-07', answers: [] },
    ]);

    const { c } = createMockContext();

    const result = await handleListPrepSessionsRoute(c as any);

    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      include: { answers: true },
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual([
      { id: 'session-2', createdAt: '2026-06-08', answers: [] },
      { id: 'session-1', createdAt: '2026-06-07', answers: [] },
    ]);
  });

  it('returns an empty array when no sessions exist', async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const { c } = createMockContext();

    const result = await handleListPrepSessionsRoute(c as any);

    expect(result.status).toBe(200);
    expect(result.data).toEqual([]);
  });

  it('calls findMany with correct orderBy and include', async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const { c } = createMockContext();

    await handleListPrepSessionsRoute(c as any);

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        include: { answers: true },
      })
    );
  });
});
