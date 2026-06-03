export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? 'null'
  } catch {
    return '[Unable to render JSON]'
  }
}