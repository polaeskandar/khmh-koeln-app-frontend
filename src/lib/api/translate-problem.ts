import type { ApiError } from "./problem"

export type ProblemTranslator = {
  (key: string, values?: Record<string, string | number>): string
  has(key: string): boolean
}

export type Problem = {
  status: number
  code: string | null
  message: string
  fieldErrors: Record<string, string>
  extensions: Record<string, unknown>
}

function statusKey(status: number) {
  if (status === 0) {
    return "errors.network"
  }

  if (status === 401) {
    return "errors.auth.unauthenticated"
  }

  if (status === 403) {
    return "errors.forbidden"
  }

  if (status === 404) {
    return "errors.title.notFound"
  }

  if (status === 409) {
    return "errors.title.conflict"
  }

  if (status === 422) {
    return "errors.checkFields"
  }

  if (status === 429) {
    return "errors.tooManyRequests"
  }

  if (status === 503) {
    return "errors.unavailable"
  }

  if (status >= 500) {
    return "errors.internal"
  }

  return "errors.invalidRequest"
}

const values = (params: Record<string, unknown>) => params as Record<string, string | number>

export function translateProblem(error: ApiError, t: ProblemTranslator): string {
  const key = error.code ? `errors.${error.code}` : null

  return key && t.has(key) ? t(key, values(error.params)) : t(statusKey(error.status))
}

export function fieldErrorsOf(error: ApiError, t: ProblemTranslator): Record<string, string> {
  return Object.fromEntries(
    Object.entries(error.fieldErrors).map(([field, { code, params }]) => {
      const key = `errors.${code}`

      return [field, t.has(key) ? t(key, values(params)) : t("errors.checkFields")]
    })
  )
}

export function describeProblem(error: ApiError, t: ProblemTranslator): Problem {
  return {
    status: error.status,
    code: error.code,
    message: translateProblem(error, t),
    fieldErrors: fieldErrorsOf(error, t),
    extensions: error.extensions,
  }
}
