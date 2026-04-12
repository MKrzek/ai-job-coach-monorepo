import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const jdScorerTool = createTool({
  id: 'jd-scorer',
  description: `Scores how well a candidate's CV matches a job description.
  Returns a score from 0-100 and a breakdown of matching and missing skills.`,

  inputSchema: z.object({
    jobDescription: z.string().describe('The full job description text'),
    cvText: z.string().describe('The candidate CV or summary text'),
  }),

  outputSchema: z.object({
    score: z.number().min(0).max(100),
    matchingSkills: z.array(z.string()),
    missingSkills: z.array(z.string()),
    summary: z.string(),
  }),

  // ✅ v1 signature: (inputData, context?) — no { context } destructuring
  execute: async (inputData) => {
    const { jobDescription, cvText } = inputData;

    const jdWords = new Set(
      jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    );
    const cvWords = new Set(
      cvText.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    );

    const techKeywords = [
      'typescript', 'javascript', 'react', 'node', 'express', 'postgresql',
      'docker', 'testing', 'jest', 'vitest', 'prisma', 'redis', 'rest',
      'graphql', 'aws', 'accessibility', 'agile',
    ];

    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const keyword of techKeywords) {
      const inJD = jobDescription.toLowerCase().includes(keyword);
      const inCV = cvText.toLowerCase().includes(keyword);
      if (inJD && inCV) matchingSkills.push(keyword);
      if (inJD && !inCV) missingSkills.push(keyword);
    }

    const overlapCount = [...jdWords].filter(w => cvWords.has(w)).length;
    const score = Math.min(
      100,
      Math.round(
        (matchingSkills.length / Math.max(matchingSkills.length + missingSkills.length, 1)) * 70 +
        (overlapCount / Math.max(jdWords.size, 1)) * 30
      )
    );

    return {
      score,
      matchingSkills,
      missingSkills,
      summary: `CV matches ${score}% of the job requirements. Found ${matchingSkills.length} matching skills, missing ${missingSkills.length} key skills from the JD.`,
    };
  },
});