import type { CvAnalysisResult } from '../types/chat'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isTextPart(
  part: unknown
): part is { type: 'text'; text: string } {
  return (
    isRecord(part) &&
    part.type === 'text' &&
    typeof part.text === 'string'
  )
}

export function isToolPart(
  part: unknown
): part is Record<string, unknown> & {
  type: `tool-${string}`
  toolName?: string
  state?: string
} {
  return (
    isRecord(part) &&
    typeof part.type === 'string' &&
    part.type.startsWith('tool-')
  )
}

export function getToolName(part: unknown): string | null {
  if (!isToolPart(part)) return null

  if (typeof part.toolName === 'string' && part.toolName.length > 0) {
    return part.toolName
  }

  return part.type.replace('tool-', '')
}

export function getToolInput(part: unknown): unknown {
  if (!isToolPart(part)) return undefined

  return 'input' in part ? part.input : undefined
}

export function getToolOutput(part: unknown): unknown {
  if (!isToolPart(part)) return undefined

  if ('output' in part && part.output !== undefined) return part.output
  if ('result' in part && part.result !== undefined) return part.result

  return undefined
}

export function isToolComplete(part: unknown): boolean {
  if (!isToolPart(part)) return false

  return part.state === 'result' || part.state === 'output-available'
}

export function hasNumericScore(
  value: unknown
): value is Record<'score', number> {
  return isRecord(value) && typeof value.score === 'number'
}

export function isCvAnalysisResult(output: unknown): output is CvAnalysisResult {
  if (!isRecord(output)) return false

  return (
    typeof output.score === 'number' &&
    Array.isArray(output.matchingSkills) &&
    Array.isArray(output.missingSkills) &&
    typeof output.summary === 'string'
  )
}