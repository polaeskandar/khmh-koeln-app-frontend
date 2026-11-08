export type FieldError = { code: string; params: Record<string, unknown> }

type ApiErrorInit = {
  status: number
  code: string | null
  params?: Record<string, unknown>
  fieldErrors?: Record<string, FieldError>
  retryAfter?: number | null
  extensions?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string | null
  readonly params: Record<string, unknown>
  readonly fieldErrors: Record<string, FieldError>
  readonly retryAfter: number | null
  readonly extensions: Record<string, unknown>

  constructor(init: ApiErrorInit) {
    super(init.code ? `${init.status} ${init.code}` : `HTTP ${init.status}`)
    this.name = "ApiError"
    this.status = init.status
    this.code = init.code
    this.params = init.params ?? {}
    this.fieldErrors = init.fieldErrors ?? {}
    this.retryAfter = init.retryAfter ?? null
    this.extensions = init.extensions ?? {}
  }
}

export const networkError = () => new ApiError({ status: 0, code: "network" })

const STANDARD_MEMBERS = new Set(["status", "code", "params", "fieldErrors"])

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

function retryAfterOf(response: Response): number | null {
  const header = response.headers.get("Retry-After")

  if (header === null || !/^\d+$/.test(header.trim())) {
    return null
  }

  return Number(header)
}

export const isAbort = (error: unknown): error is Error =>
  error instanceof Error && error.name === "AbortError"

async function bodyOf(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch (error) {
    if (isAbort(error)) {
      throw error
    }

    return null
  }
}

export async function problemOf(response: Response): Promise<ApiError> {
  const retryAfter = retryAfterOf(response)
  const isProblem = response.headers.get("Content-Type")?.includes("application/problem+json")
  const body = isProblem ? await bodyOf(response) : null

  if (!isObject(body) || typeof body.code !== "string") {
    return new ApiError({ status: response.status, code: null, retryAfter })
  }

  const { code, params, fieldErrors } = body

  return new ApiError({
    status: response.status,
    code,
    params: isObject(params) ? params : {},
    fieldErrors: isObject(fieldErrors) ? (fieldErrors as Record<string, FieldError>) : {},
    retryAfter,
    extensions: Object.fromEntries(
      Object.entries(body).filter(([name]) => !STANDARD_MEMBERS.has(name))
    ),
  })
}
