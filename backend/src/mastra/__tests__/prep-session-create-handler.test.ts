import { describe, it, expect, beforeEach, vi } from 'vitest';

const {
  mockStart,
  mockCreateRun,
  mockPrepSessionCreate,
} = vi.hoisted(() => ({
  mockStart: vi.fn(),
  mockCreateRun: vi.fn(),
  mockPrepSessionCreate: vi.fn(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    prepSession: {
      create: mockPrepSessionCreate,
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import {
  handleCreatePrepSessionRoute,
  mastra,
} from '../../mastra/index.js';

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

describe('handleCreatePrepSessionRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateRun.mockResolvedValue({
      start: mockStart,
    });

    vi.spyOn(mastra, 'getWorkflow').mockReturnValue({
      createRun: mockCreateRun,
    } as any);
  });

  it('returns 400 when jobDescription is missing', async () => {
    const { c, json } = createMockContext({});

    const result = await handleCreatePrepSessionRoute(c as any);

    expect(result.status).toBe(400);
    expect(json).toHaveBeenCalledWith(
      { error: 'jobDescription is required' },
      400
    );
    expect(mockPrepSessionCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when jobDescription is blank', async () => {
    const { c, json } = createMockContext({ jobDescription: '   ' });

    const result = await handleCreatePrepSessionRoute(c as any);

    expect(result.status).toBe(400);
    expect(json).toHaveBeenCalledWith(
      { error: 'jobDescription is required' },
      400
    );
  });

  it('returns 500 when workflow returns no answers', async () => {
    mockStart.mockResolvedValueOnce({
      status: 'success',
      result: { answers: [] },
    });

    const { c } = createMockContext({
      jobDescription: 'Frontend Engineer requiring React and TypeScript',
    });

    const result = await handleCreatePrepSessionRoute(c as any);

    expect(result.status).toBe(500);
    expect(result.data).toEqual({ error: 'Workflow returned no answers' });
    expect(mockPrepSessionCreate).not.toHaveBeenCalled();
  });

  it('returns 500 when workflow status is not success', async () => {
    mockStart.mockResolvedValueOnce({
      status: 'failed',
      result: null,
    });

    const { c } = createMockContext({
      jobDescription: 'Frontend Engineer requiring React and TypeScript',
    });

    const result = await handleCreatePrepSessionRoute(c as any);

    expect(result.status).toBe(500);
    expect(result.data).toEqual({ error: 'Workflow returned no answers' });
    expect(mockPrepSessionCreate).not.toHaveBeenCalled();
  });

  it('creates a prep session and returns 201 on success', async () => {
    mockStart.mockResolvedValueOnce({
      status: 'success',
      result: {
        answers: [
          {
            question: 'Tell me about yourself',
            type: 'behavioral',
            modelAnswer: 'A concise answer',
            keyPoints: ['Background', 'Impact'],
          },
          {
            question: 'Explain React rendering',
            type: 'technical',
            modelAnswer: 'A technical answer',
            keyPoints: ['VDOM', 'Reconciliation'],
          },
        ],
      },
    });

    mockPrepSessionCreate.mockResolvedValueOnce({
      id: 'session-1',
      jobDescription: 'Frontend Engineer requiring React and TypeScript',
      roleTitle: 'Unknown Role',
      answers: [{ id: 'a1', question: 'Tell me about yourself' }],
    });

    const { c } = createMockContext({
      jobDescription: 'Frontend Engineer requiring React and TypeScript',
    });

    const result = await handleCreatePrepSessionRoute(c as any);

    expect(result.status).toBe(201);

    expect(mockCreateRun).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledWith({
      inputData: {
        jobDescription: 'Frontend Engineer requiring React and TypeScript',
      },
    });

    expect(mockPrepSessionCreate).toHaveBeenCalledWith({
      data: {
        jobDescription: 'Frontend Engineer requiring React and TypeScript',
        roleTitle: 'Unknown Role',
        answers: {
          create: [
            {
              question: 'Tell me about yourself',
              type: 'behavioral',
              modelAnswer: 'A concise answer',
              keyPoints: ['Background', 'Impact'],
            },
            {
              question: 'Explain React rendering',
              type: 'technical',
              modelAnswer: 'A technical answer',
              keyPoints: ['VDOM', 'Reconciliation'],
            },
          ],
        },
      },
      include: { answers: true },
    });

    expect(result.data).toEqual(
      expect.objectContaining({ id: 'session-1' })
    );
  });

  it('returns 500 when workflow throws', async () => {
    mockCreateRun.mockRejectedValueOnce(new Error('workflow crashed'));

    const { c } = createMockContext({
      jobDescription: 'Frontend Engineer requiring React and TypeScript',
    });

    const result = await handleCreatePrepSessionRoute(c as any);

    expect(result.status).toBe(500);
    expect(result.data).toEqual({ error: 'Failed to run workflow' });
  });
});
