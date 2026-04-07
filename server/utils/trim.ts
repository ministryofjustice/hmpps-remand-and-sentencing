export default function trimForm<T>(form: Record<string, unknown>): T {
  return Object.keys(form).reduce((acc, curr) => {
    acc[curr] = trimItem(form[curr])
    return acc
  }, {} as T)
}

export function normaliseToArray(value: unknown): string[] {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value.map(v => String(v).trim())
  return [String(value).trim()]
}

function trimItem(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim().replace(/\0/g, '')
  }
  if (Array.isArray(value)) {
    return value.map(item => trimItem(item))
  }
  if (typeof value === 'object') {
    return trimForm(value as Record<string, unknown>)
  }
  return value
}
