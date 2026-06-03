import type { UIMessage } from 'ai'

export type RequirementRewrite = {
  requirement: string
  original: string
  revised: string
}

export type MissingRequirement = {
  requirement: string
  reason: string
}

export type RewriteBlock = {
  withEvidence: RequirementRewrite[]
  noEvidence: MissingRequirement[]
}

export type CvAnalysisResult = {
  score: number
  matchingSkills: string[]
  missingSkills: string[]
  summary: string
  rewriteBlock: RewriteBlock
}

export type AppUIMessage = UIMessage