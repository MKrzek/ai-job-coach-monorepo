import { describe, it, expect, beforeEach, vi } from 'vitest';

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

import { handleCvChatRoute, mastra } from '../../mastra/index.js';

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

describe('handleCvChatRoute', () => {
  const mockStream = vi.fn().mockResolvedValue({
    async *[Symbol.asyncIterator]() { },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockStream.mockClear();

    vi.spyOn(mastra, 'getAgent').mockImplementation((id: any) => {
      return {
        name: id === 'cvRewriterAgent' ? 'CV Rewriter' : 'CV Analyser',
        stream: mockStream,
      } as any;
    });
  });

  it('returns 400 when messages are missing', async () => {
    const { c, json } = createMockContext({
      latestText: 'analyse my cv',
      userId: 'user-test-1',
    });

    const result = await handleCvChatRoute(c as any);

    expect(result.status).toBe(400);
    expect(json).toHaveBeenCalledWith(
      { error: 'messages is required' },
      400
    );
  });

  it('routes rewrite prompts to cvRewriterAgent', async () => {
    const getAgentSpy = vi.spyOn(mastra, 'getAgent');

    const { c } = createMockContext({
      messages: [{ role: 'user', content: 'rewrite my bullet points' }],
      latestText: 'rewrite my bullet points',
      userId: 'user-test-1',
    });

    const result = await handleCvChatRoute(c as any);

    expect(result.status).toBe(200);
    expect(getAgentSpy).toHaveBeenCalledWith('cvRewriterAgent');
    expect(mockStream).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        memory: {
          resource: 'user-test-1',
          thread: 'user-test-1-cv-thread',
        },
      })
    );
  });

  it('routes analysis prompts to cvAnalyserAgent', async () => {
    const getAgentSpy = vi.spyOn(mastra, 'getAgent');

    const { c } = createMockContext({
      messages: [{ role: 'user', content: 'how strong is my cv?' }],
      latestText: 'how strong is my cv?',
      userId: 'user-test-1',
    });

    const result = await handleCvChatRoute(c as any);

    expect(result.status).toBe(200);
    expect(getAgentSpy).toHaveBeenCalledWith('cvAnalyserAgent');
  });

  it('uses default thread id when threadId is omitted', async () => {
    const { c } = createMockContext({
      messages: [{ role: 'user', content: 'analyse my cv' }],
      latestText: 'analyse my cv',
      userId: 'default-user',
    });

    const result = await handleCvChatRoute(c as any);

    expect(result.status).toBe(200);
    expect(mockStream).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        memory: {
          resource: 'default-user',
          thread: 'default-user-cv-thread',
        },
      })
    );
  });

  it('uses provided thread id when present', async () => {
    const { c } = createMockContext({
      messages: [{ role: 'user', content: 'analyse my cv' }],
      latestText: 'analyse my cv',
      userId: 'user-test-1',
      threadId: 'custom-thread-123',
    });

    const result = await handleCvChatRoute(c as any);

    expect(result.status).toBe(200);
    expect(mockStream).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        memory: {
          resource: 'user-test-1',
          thread: 'custom-thread-123',
        },
      })
    );
  });

  it('sets headers with intent and threadId', async () => {
    const { c } = createMockContext({
      messages: [{ role: 'user', content: 'rewrite my cv' }],
      latestText: 'rewrite my cv',
      userId: 'user-test-1',
    });

    const result = await handleCvChatRoute(c as any);

    expect(result.status).toBe(200);
    expect(result.headers).toEqual(
      expect.objectContaining({
        'X-Agent-Used': 'rewrite',
        'X-Thread-Id': 'user-test-1-cv-thread',
      })
    );
  });
});