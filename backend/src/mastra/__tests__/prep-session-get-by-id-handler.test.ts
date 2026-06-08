import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    prepSession: {
      create: vi.fn(),
      findUnique: mockFindUnique,
      findMany: vi.fn(),
    },
  },
}));

import { handleGetPrepSessionByIdRoute } from '../../mastra/index.js';

function createMockContext(id: string) {
  const json = vi.fn((data: any, status = 200) => ({ data, status }));

  return {
    c: {
      req: {
        param: vi.fn((key: string) => {
          if (key === 'id') return id;
          throw new Error(`Unexpected param: ${key}`);
        }),
      },
      json,
    },
    json,
  };
}

describe('handleGetPrepSessionByIdRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when session is not found', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const { c, json } = createMockContext('missing-session');

    const result = await handleGetPrepSessionByIdRoute(c as any);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'missing-session' },
      include: { answers: true },
    });

    expect(result.status).toBe(404);
    expect(json).toHaveBeenCalledWith(
      { error: 'Session not found' },
      404
    );
  });

  it('returns 200 with session when found', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'session-1',
      jobDescription: 'Frontend Engineer role',
      roleTitle: 'Unknown Role',
      answers: [{ id: 'a1', question: 'Tell me about yourself' }],
    });

    const { c } = createMockContext('session-1');

    const result = await handleGetPrepSessionByIdRoute(c as any);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      include: { answers: true },
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual({
      id: 'session-1',
      jobDescription: 'Frontend Engineer role',
      roleTitle: 'Unknown Role',
      answers: [{ id: 'a1', question: 'Tell me about yourself' }],
    });
  });

  it('queries with the correct session id', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'abc-123',
      jobDescription: 'Backend role',
      answers: [],
    });

    const { c } = createMockContext('abc-123');

    await handleGetPrepSessionByIdRoute(c as any);

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'abc-123' },
      })
    );
  });
});
