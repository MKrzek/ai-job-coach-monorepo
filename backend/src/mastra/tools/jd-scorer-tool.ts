import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const requirementRewriteSchema = z.object({
  requirement: z.string(),
  original: z.string(),
  revised: z.string(),
});

const missingRequirementSchema = z.object({
  requirement: z.string(),
  reason: z.string(),
});

export const jdScorerTool = createTool({
  id: 'jd-scorer',
  description: `Scores how well a candidate's CV matches a job description.
Returns a score from 0-100, a breakdown of matching and missing skills,
and evidence-based rewritten CV bullets where direct evidence exists.`,

  inputSchema: z.object({
    jobDescription: z.string().describe('The full job description text'),
    cvText: z.string().describe('The candidate CV or summary text'),
  }),

  outputSchema: z.object({
    score: z.number().min(0).max(100),
    matchingSkills: z.array(z.string()),
    missingSkills: z.array(z.string()),
    summary: z.string(),
    rewriteBlock: z.object({
      withEvidence: z.array(requirementRewriteSchema),
      noEvidence: z.array(missingRequirementSchema),
    }),
  }),

  execute: async (inputData) => {
    const { jobDescription, cvText } = inputData;

    const jobDescriptionLower = jobDescription.toLowerCase();
    const cvTextLower = cvText.toLowerCase();

    const jdWords = new Set(
      jobDescriptionLower.match(/\b[a-z]{4,}\b/g) || []
    );

    const cvWords = new Set(
      cvTextLower.match(/\b[a-z]{4,}\b/g) || []
    );

    const techKeywords = [
      'typescript',
      'javascript',
      'react',
      'node',
      'express',
      'postgresql',
      'docker',
      'testing',
      'jest',
      'vitest',
      'prisma',
      'redis',
      'rest',
      'graphql',
      'aws',
      'accessibility',
      'agile',
      'cypress',
      'performance',
      'oauth',
      'jwt',
    ];

    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const keyword of techKeywords) {
      const inJD = jobDescriptionLower.includes(keyword);
      const inCV = cvTextLower.includes(keyword);

      if (inJD && inCV) matchingSkills.push(keyword);
      if (inJD && !inCV) missingSkills.push(keyword);
    }

    const overlapCount = [...jdWords].filter((w) => cvWords.has(w)).length;

    const score = Math.min(
      100,
      Math.round(
        (matchingSkills.length /
          Math.max(matchingSkills.length + missingSkills.length, 1)) * 70 +
        (overlapCount / Math.max(jdWords.size, 1)) * 30
      )
    );

    const cvLines = cvText
      .split(/\n|•|-/)
      .map((line) => line.trim())
      .filter((line) => line.length > 20);

    const requirementPatterns: Array<{
      requirement: string;
      matchers: string[];
      rewrite: (original: string) => string;
    }> = [
        {
          requirement: 'React and TypeScript',
          matchers: ['react', 'typescript'],
          rewrite: (original) =>
            `Delivered frontend applications using React and TypeScript, applying modern engineering practices in production environments.`,
        },
        {
          requirement: 'Testing culture',
          matchers: ['jest', 'testing', 'cypress', 'react testing library'],
          rewrite: (original) =>
            `Implemented a strong testing approach using tools such as Jest, React Testing Library, and Cypress to improve application reliability.`,
        },
        {
          requirement: 'Node.js backend experience',
          matchers: ['node', 'express', 'rest', 'postgresql'],
          rewrite: (original) =>
            `Built backend services with Node.js and Express, including REST APIs and database-backed application flows.`,
        },
        {
          requirement: 'Accessibility expertise',
          matchers: ['accessibility', 'wcag'],
          rewrite: (original) =>
            `Built accessible applications aligned with recognised accessibility standards, including WCAG-based requirements.`,
        },
        {
          requirement: 'Performance optimisation',
          matchers: ['performance', 'lazy loading', 'code splitting', 'page load'],
          rewrite: (original) =>
            `Improved frontend performance through optimisation techniques such as code splitting, lazy loading, and related delivery improvements.`,
        },
        {
          requirement: 'Authentication and secure APIs',
          matchers: ['jwt', 'oauth', 'authentication'],
          rewrite: (original) =>
            `Implemented secure authentication and API flows using established approaches such as JWT and OAuth.`,
        },
      ];

    const withEvidence: Array<{
      requirement: string;
      original: string;
      revised: string;
    }> = [];

    const noEvidence: Array<{
      requirement: string;
      reason: string;
    }> = [];

    for (const pattern of requirementPatterns) {
      const evidenceLine = cvLines.find((line) =>
        pattern.matchers.some((matcher) =>
          line.toLowerCase().includes(matcher)
        )
      );

      const jdMentionsRequirement = pattern.matchers.some((matcher) =>
        jobDescriptionLower.includes(matcher)
      );

      if (!jdMentionsRequirement) continue;

      if (evidenceLine) {
        withEvidence.push({
          requirement: pattern.requirement,
          original: evidenceLine,
          revised: pattern.rewrite(evidenceLine),
        });
      } else {
        noEvidence.push({
          requirement: pattern.requirement,
          reason: 'No evidence found',
        });
      }
    }

    return {
      score,
      matchingSkills,
      missingSkills,
      summary: `CV matches ${score}% of the job requirements. Found ${matchingSkills.length} matching skills, missing ${missingSkills.length} key skills from the JD.`,
      rewriteBlock: {
        withEvidence,
        noEvidence,
      },
    };
  },
});