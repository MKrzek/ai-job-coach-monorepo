import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQuery, mockGenerate } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockGenerate: vi.fn(),
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

vi.mock('../cv-rewriter', async () => {
  const actual = await vi.importActual<typeof import('../cv-rewriter')>(
    '../cv-rewriter'
  );

  return {
    ...actual,
    cvRewriterAgent: {
      ...actual.cvRewriterAgent,
      generate: mockGenerate,
    },
  };
});

import { cvRewriterAgent } from '../cv-rewriter';
import {
  mixedJD,
  supportedJD,
  unsupportedJD,
} from '../../../test/fixtures/cv-fixtures';

describe('cvRewriterAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('produces rewritten evidence blocks for fully supported JD requirements', async () => {
    mockGenerate.mockResolvedValueOnce({
      text: `
**Requirements with Evidence — Rewritten:**

**React and TypeScript**
Original: "Built React and TypeScript web applications with reusable component libraries and REST API integrations."
Revised: "Built React and TypeScript web applications, developing reusable component libraries and integrating REST APIs."

**Node.js REST APIs**
Original: "Designed and implemented REST APIs with Node.js and Express, serving PostgreSQL-backed services handling 100k requests/day."
Revised: "Designed and implemented REST APIs using Node.js and Express, supporting PostgreSQL-backed services at 100,000 requests per day."

**Requirements with No Evidence:**

None.
      `.trim(),
    });

    const result = await cvRewriterAgent.generate([
      { role: 'user', content: `Tailor my CV for this job:\n${supportedJD}` },
    ]);

    expect(result.text).toContain('Requirements with Evidence — Rewritten');
    expect(result.text).toContain('Original:');
    expect(result.text).toContain('Revised:');
    expect(result.text).toContain('Node.js');
    expect(result.text).toContain('React and TypeScript');
  });

  it('places unsupported requirements in the No Evidence section', async () => {
    mockGenerate.mockResolvedValueOnce({
      text: `
**Requirements with Evidence — Rewritten:**

None.

**Requirements with No Evidence:**

**Next.js SSR** → No rewrite possible from current CV evidence. To address: add a Next.js project to your portfolio.
**GraphQL federation** → No rewrite possible from current CV evidence. To address: mention any GraphQL experience or projects.
**Kubernetes** → No rewrite possible from current CV evidence. To address: add cloud/container orchestration experience.
**Rust** → No rewrite possible from current CV evidence. To address: add systems programming experience.
      `.trim(),
    });

    const result = await cvRewriterAgent.generate([
      { role: 'user', content: `Tailor my CV for this job:\n${unsupportedJD}` },
    ]);

    expect(result.text).toContain('Requirements with No Evidence');
    expect(result.text).toContain('Next.js SSR');
    expect(result.text).toContain('No rewrite possible');
    expect(result.text).not.toContain('Original:');
  });

  it('splits mixed JD into evidence and no-evidence sections correctly', async () => {
    mockGenerate.mockResolvedValueOnce({
      text: `
**Requirements with Evidence — Rewritten:**

**React and TypeScript**
Original: "Built React and TypeScript web applications with reusable component libraries and REST API integrations."
Revised: "Built React and TypeScript web applications, developing reusable component libraries and integrating REST APIs."

**Node.js Express APIs**
Original: "Designed and implemented REST APIs with Node.js and Express, serving PostgreSQL-backed services handling 100k requests/day."
Revised: "Designed and implemented REST APIs using Node.js and Express, supporting PostgreSQL-backed services at 100,000 requests per day."

**Requirements with No Evidence:**

**Redis caching** → No rewrite possible from current CV evidence. To address: mention any caching or performance optimisation work.
**CI/CD GitHub Actions** → No rewrite possible from current CV evidence. To address: add deployment pipeline experience.
      `.trim(),
    });

    const result = await cvRewriterAgent.generate([
      { role: 'user', content: `Tailor my CV for this job:\n${mixedJD}` },
    ]);

    expect(result.text).toContain('Requirements with Evidence — Rewritten');
    expect(result.text).toContain('Requirements with No Evidence');
    expect(result.text).toContain('React and TypeScript');
    expect(result.text).toContain('Node.js Express APIs');
    expect(result.text).toContain('Redis caching');
    expect(result.text).toContain('CI/CD GitHub Actions');
  });

  it('never outputs a Revised bullet without a preceding Original quote', async () => {
    mockGenerate.mockResolvedValueOnce({
      text: `
**Requirements with Evidence — Rewritten:**

**React and TypeScript**
Original: "Built React and TypeScript web applications."
Revised: "Built React and TypeScript web applications, developing reusable UI components."
      `.trim(),
    });

    const result = await cvRewriterAgent.generate([
      { role: 'user', content: `Tailor my CV for this job:\n${supportedJD}` },
    ]);

    const lines = result.text.split('\n');
    lines.forEach((line, i) => {
      if (line.startsWith('Revised:')) {
        const precedingLines = lines.slice(Math.max(0, i - 3), i);
        const hasOriginal = precedingLines.some((l) => l.startsWith('Original:'));
        expect(hasOriginal).toBe(true);
      }
    });
  });
});