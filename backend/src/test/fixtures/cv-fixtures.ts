export const cvChunks = [
  {
    userId: 'user-test-1',
    chunkIndex: 0,
    source: 'cv',
    text: 'Built React and TypeScript web applications with reusable component libraries and REST API integrations.',
  },
  {
    userId: 'user-test-1',
    chunkIndex: 1,
    source: 'cv',
    text: 'Designed and implemented REST APIs with Node.js and Express, serving PostgreSQL-backed services handling 100k requests/day.',
  },
  {
    userId: 'user-test-1',
    chunkIndex: 2,
    source: 'cv',
    text: 'Improved accessibility using WCAG 2.1 AA patterns, semantic HTML, and keyboard navigation support across 3 products.',
  },
  {
    userId: 'user-test-2',
    chunkIndex: 0,
    source: 'cv',
    text: 'Built Python ETL pipelines and managed Spark clusters.',
  },
];

export const supportedJD = `
We are looking for a frontend engineer with:
- React and TypeScript experience
- Node.js and REST API development
- PostgreSQL database knowledge
- WCAG accessibility compliance
`;

export const unsupportedJD = `
We are looking for an engineer with:
- Next.js SSR and React Server Components
- GraphQL federation with Apollo
- Kubernetes cluster management
- Rust systems programming
`;

export const mixedJD = `
We are looking for a full-stack engineer with:
- React and TypeScript (required)
- Node.js Express APIs (required)
- Redis caching (nice to have)
- CI/CD GitHub Actions (nice to have)
`;