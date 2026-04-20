import { createWorkflow, createStep } from '@mastra/core/workflows'
import { z } from 'zod'

const parseJSON = (text: string) => {
  const clean = text.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(clean)
}

// ── Shared schema for parallel steps ─────────────────────────────────────

const parallelInputSchema = z.object({
  technicalSkills: z.array(z.string()),
  behaviouralCompetencies: z.array(z.string()),
  roleTitle: z.string(),
})

// ── Step 1: Extract key competencies from JD ──────────────────────────────

const extractCompetencies = createStep({
  id: 'extract-competencies',
  inputSchema: z.object({
    jobDescription: z.string(),
  }),
  outputSchema: z.object({
    technicalSkills: z.array(z.string()),
    behaviouralCompetencies: z.array(z.string()),
    roleTitle: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('cvAnalyserAgent')
    const result = await agent.generate(
      `Extract from this job description and return ONLY a valid JSON object with exactly these fields:
      {
        "technicalSkills": ["up to 6 technical skills required"],
        "behaviouralCompetencies": ["up to 5 behavioural competencies"],
        "roleTitle": "the job title"
      }

      No markdown. No explanation. JSON only.

      Job Description:
      ${inputData.jobDescription}`
    )
    return parseJSON(result.text)
  },
})

// ── Step 2a: Generate behavioural questions ───────────────────────────────

const generateBehaviouralQuestions = createStep({
  id: 'generate-behavioural-questions',
  inputSchema: parallelInputSchema,
  outputSchema: z.object({
    questions: z.array(z.string()),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('cvAnalyserAgent')
    const result = await agent.generate(
      `Generate 4 behavioural interview questions for a ${inputData.roleTitle} role.
      Focus on these competencies: ${inputData.behaviouralCompetencies.join(', ')}.
      Use STAR format prompts (e.g. "Tell me about a time when...").

      Return ONLY a valid JSON object:
      { "questions": ["question 1", "question 2", "question 3", "question 4"] }

      No markdown. No explanation. JSON only.`
    )
    return parseJSON(result.text)
  },
})

// ── Step 2b: Generate technical questions ─────────────────────────────────

const generateTechnicalQuestions = createStep({
  id: 'generate-technical-questions',
  inputSchema: parallelInputSchema,
  outputSchema: z.object({
    questions: z.array(z.string()),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('cvAnalyserAgent')
    const result = await agent.generate(
      `Generate 4 technical interview questions for a ${inputData.roleTitle} role.
      Cover these skills: ${inputData.technicalSkills.join(', ')}.
      Mix conceptual and practical questions.

      Return ONLY a valid JSON object:
      { "questions": ["question 1", "question 2", "question 3", "question 4"] }

      No markdown. No explanation. JSON only.`
    )
    return parseJSON(result.text)
  },
})

// ── Step 3: Produce model answers ─────────────────────────────────────────

const generateModelAnswers = createStep({
  id: 'generate-model-answers',
  inputSchema: z.object({
    'generate-behavioural-questions': z.object({ questions: z.array(z.string()) }),
    'generate-technical-questions': z.object({ questions: z.array(z.string()) }),
  }),
  outputSchema: z.object({
    answers: z.array(z.object({
      question: z.string(),
      type: z.enum(['behavioural', 'technical']),
      modelAnswer: z.string(),
      keyPoints: z.array(z.string()),
    })),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('cvAnalyserAgent')

    const behaviouralQuestions = inputData['generate-behavioural-questions'].questions
    const technicalQuestions = inputData['generate-technical-questions'].questions

    const allQuestions = [
      ...behaviouralQuestions.map(q => `[behavioural] ${q}`),
      ...technicalQuestions.map(q => `[technical] ${q}`),
    ]

    const result = await agent.generate(
      `For each question below, write a strong model answer for a candidate.
      For behavioural questions: use STAR structure.
      For technical questions: be clear and accurate.
      Also list 3 key points the answer demonstrates.

      Return ONLY a valid JSON object:
      {
        "answers": [
          {
            "question": "the question",
            "type": "behavioural or technical",
            "modelAnswer": "the full answer",
            "keyPoints": ["point 1", "point 2", "point 3"]
          }
        ]
      }

      No markdown. No explanation. JSON only.

      Questions:
      ${allQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    )
    return parseJSON(result.text)
  },
})

// ── Assemble the workflow ─────────────────────────────────────────────────

export const interviewPrepWorkflow = createWorkflow({
  id: 'interview-prep',
  inputSchema: z.object({
    jobDescription: z.string(),
  }),
  outputSchema: z.object({
    answers: z.array(z.object({
      question: z.string(),
      type: z.enum(['behavioural', 'technical']),
      modelAnswer: z.string(),
      keyPoints: z.array(z.string()),
    })),
  }),
})
  .then(extractCompetencies)
  .parallel([generateBehaviouralQuestions, generateTechnicalQuestions])
  .then(generateModelAnswers)
  .commit()