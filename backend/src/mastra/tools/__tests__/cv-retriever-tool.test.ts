import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('ai', () => ({
  embed: vi.fn().mockResolvedValue({
    embedding: new Array(1536).fill(0.1),
  }),
}));

vi.mock('@mastra/pg', () => {
  const PgVector = vi.fn(
    class {
      query = mockQuery;
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

import { cvChunks } from '../../../test/fixtures/cv-fixtures';
import { runCvRetriever } from '../cv-retriever-tool';

const user1Chunks = cvChunks.filter((c) => c.userId === 'user-test-1');

describe('runCvRetriever', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ranked matches and combinedText for a supported query', async () => {
    mockQuery.mockResolvedValueOnce(
      user1Chunks.map((chunk, i) => ({
        id: `id-${i}`,
        score: 0.9 - i * 0.05,
        metadata: {
          userId: chunk.userId,
          text: chunk.text,
          chunkIndex: chunk.chunkIndex,
          source: chunk.source,
        },
      }))
    );

    const result = await runCvRetriever({
      query: 'Node.js REST API PostgreSQL',
      userId: 'user-test-1',
      topK: 15,
    });

    expect(result.matches.length).toBe(user1Chunks.length);
    expect(result.matches[0].rank).toBe(1);

    expect(
      result.matches.some((match: { text: string }) =>
        match.text.includes('Node.js')
      )
    ).toBe(true);

    expect(result.combinedText).toContain('Node.js');
    expect(result.combinedText).toContain('React');
  });

  it('scopes results by userId without cross-contamination', async () => {
    const user2Chunks = cvChunks.filter((c) => c.userId === 'user-test-2');

    mockQuery.mockResolvedValueOnce(
      user2Chunks.map((chunk, i) => ({
        id: `id-u2-${i}`,
        score: 0.8,
        metadata: {
          userId: chunk.userId,
          text: chunk.text,
          chunkIndex: chunk.chunkIndex,
          source: chunk.source,
        },
      }))
    );

    const result = await runCvRetriever({
      query: 'Node.js REST API PostgreSQL',
      userId: 'user-test-2',
      topK: 15,
    });

    expect(
      result.matches.every(
        (match: { text: string }) =>
          !match.text.includes('React and TypeScript')
      )
    ).toBe(true);

    expect(result.combinedText).not.toContain(
      'React and TypeScript web applications'
    );
  });

  it('returns empty matches and fallback message when no results are found', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const result = await runCvRetriever({
      query: 'Kubernetes Rust GraphQL',
      userId: 'user-test-1',
      topK: 15,
    });

    expect(result.matches).toHaveLength(0);
    expect(result.combinedText).toBe('No relevant CV content found.');
  });

  it('uses default-user when userId is omitted', async () => {
    mockQuery.mockResolvedValueOnce([]);

    await runCvRetriever({
      query: 'React TypeScript',
      topK: 5,
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { userId: 'default-user' },
      })
    );
  });

  it('uses default topK of 15 when omitted', async () => {
    mockQuery.mockResolvedValueOnce([]);

    await runCvRetriever({
      query: 'React TypeScript',
      userId: 'user-test-1',
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        topK: 15,
      })
    );
  });

  it('passes topK through to the vector store query', async () => {
    mockQuery.mockResolvedValueOnce([]);

    await runCvRetriever({
      query: 'accessibility WCAG',
      userId: 'user-test-1',
      topK: 5,
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        topK: 5,
      })
    );
  });

  it('returns each match with rank, score, text, and source fields', async () => {
    mockQuery.mockResolvedValueOnce([
      {
        id: 'id-0',
        score: 0.92,
        metadata: {
          userId: 'user-test-1',
          text: 'Built React TypeScript apps',
          chunkIndex: 0,
          source: 'cv',
        },
      },
    ]);

    const result = await runCvRetriever({
      query: 'React TypeScript',
      userId: 'user-test-1',
      topK: 15,
    });

    const match = result.matches[0];

    expect(match.rank).toBe(1);
    expect(match.score).toBe(0.92);
    expect(match.text).toBe('Built React TypeScript apps');
    expect(match.source).toBe('cv');
  });
});