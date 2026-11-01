import { apiBaseUrl } from "@/lib/env"

import { networkError, problemOf } from "./problem"

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type RequestOptions = {
  method?: Method
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
  signal?: AbortSignal
}

const unauthorizedListeners = new Set<() => void>()

export function onUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener)

  return () => {
    unauthorizedListeners.delete(listener)
  }
}

function urlOf(path: string, query: RequestOptions["query"]) {
  const search = new URLSearchParams()

  for (const [name, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) {
      search.set(name, String(value))
    }
  }

  const qs = search.toString()

  return `${apiBaseUrl()}${path}${qs ? `?${qs}` : ""}`
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, query, signal }: RequestOptions = {}
): Promise<T> {
  const unsafe = method !== "GET"
  let response: Response

  try {
    response = await fetch(urlOf(path, query), {
      method,
      credentials: "include",
      cache: "no-store",
      headers: unsafe
        ? { Accept: "application/json", "Content-Type": "application/json" }
        : { Accept: "application/json" },
      body: unsafe ? JSON.stringify(body ?? {}) : undefined,
      signal,
    })
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw error
    }

    throw networkError()
  }

  if (response.ok) {
    return (response.status === 204 ? undefined : await response.json()) as T
  }

  const problem = await problemOf(response)

  if (problem.status === 401 && problem.code === "auth.unauthenticated") {
    for (const listener of [...unauthorizedListeners]) {
      listener()
    }
  }

  throw problem
}
