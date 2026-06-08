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

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();

  return {
    ...actual,
    createUIMessageStream: vi.fn(({ originalMessages, execute }) => ({
      originalMessages,
      execute,
    })),
    createUIMessageStreamResponse: vi.fn(({ stream, headers }) => ({
      status: 200,
      stream,
      headers,
    })),
  };
});

import {
  handlePracticeSessionChatRoute,
  mastra,
} from '../../mastra/index.js';

function createMockContext(sessionId: string, body: unknown) {
  const json = vi.fn((data: any, status = 200) => ({ data, status }));

  return {
    c: {
      get: vi.fn((key: string) => {
        if (key === 'mastra') return mastra;
        throw new Error(`Unexpected key: ${key}`);
      }),
      req: {
        param: vi.fn((key: string) => {
          if (key === 'sessionId') return sessionId;
          throw new Error(`Unexpected param: ${key}`);
        }),
        json: vi.fn().mockResolvedValue(body),
      },
      json,
    },
    json,
  };
}

describe('handlePracticeSessionChatRoute', () => {
  const mockStream = vi.fn().mockResolvedValue({
    async *[Symbol.asyncIterator]() { },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockStream.mockClear();

    vi.spyOn(mastra, 'getAgent').mockImplementation(() => ({
      name: 'Practice Interview Agent',
      stream: mockStream,
    } as any));
  });

  it('returns 400 when messages are missing', async () => {
    const { c, json } = createMockContext('session-1', {});

    const result = await handlePracticeSessionChatRoute(c as any);

    expect(result.status).toBe(400);
    expect(json).toHaveBeenCalledWith(
      { error: 'messages is required' },
      400
    );
    expect(mockStream).not.toHaveBeenCalled();
  });

  it('returns 400 when messages is an empty array', async () => {
    const { c, json } = createMockContext('session-1', { messages: [] });

    const result = await handlePracticeSessionChatRoute(c as any);

    expect(result.status).toBe(400);
    expect(json).toHaveBeenCalledWith(
      { error: 'messages is required' },
      400
    );
  });

  it('always uses practiceInterviewAgent', async () => {
    mockFindUnique.mockResolvedValueOnce({
      jobDescription: 'Frontend Engineer role',
    });

    const getAgentSpy = vi.spyOn(mastra, 'getAgent');

    const { c } = createMockContext('session-1', {
      messages: [{ role: 'user', content: 'Hello' }],
    });

    await handlePracticeSessionChatRoute(c as any);

    expect(getAgentSpy).toHaveBeenCalledWith('practiceInterviewAgent');
  });

  it('uses sessionId as both memory resource and thread', async () => {
    mockFindUnique.mockResolvedValueOnce({
      jobDescription: 'Backend Engineer role',
    });

    const { c } = createMockContext('session-abc', {
      messages: [{ role: 'user', content: 'Hello' }],
    });

    await handlePracticeSessionChatRoute(c as any);

    expect(mockStream).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        memory: {
          resource: 'session-abc',
          thread: 'session-abc',
        },
      })
    );
  });

  it('passes JD instructions when session has a jobDescription', async () => {
    mockFindUnique.mockResolvedValueOnce({
      jobDescription: 'Backend Engineer requiring Node and PostgreSQL',
    });

    const { c } = createMockContext('session-1', {
      messages: [{ role: 'user', content: 'Hello' }],
    });

    await handlePracticeSessionChatRoute(c as any);

    expect(mockStream).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        instructions: expect.stringContaining(
          'Backend Engineer requiring Node and PostgreSQL'
        ),
      })
    );
  });

  it('passes undefined instructions when session has no jobDescription', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const { c } = createMockContext('session-1', {
      messages: [{ role: 'user', content: 'Hello' }],
    });

    await handlePracticeSessionChatRoute(c as any);

    expect(mockStream).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        instructions: undefined,
      })
    );
  });

  it('queries prisma with the correct sessionId', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const { c } = createMockContext('session-xyz', {
      messages: [{ role: 'user', content: 'Hello' }],
    });

    await handlePracticeSessionChatRoute(c as any);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'session-xyz' },
      select: { jobDescription: true },
    });
  });

  it('returns 200 with stream response', async () => {
    mockFindUnique.mockResolvedValueOnce({
      jobDescription: 'Frontend Engineer role',
    });

    const { c } = createMockContext('session-1', {
      messages: [{ role: 'user', content: 'Hello' }],
    });

    const result = await handlePracticeSessionChatRoute(c as any);

    expect(result.status).toBe(200);
  });
});