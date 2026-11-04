import createClient, { type Middleware } from "openapi-fetch"

import { apiBaseUrl } from "@/lib/env"

import { networkError, problemOf } from "./problem"
import type { components, paths } from "./schema"

export type Schemas = components["schemas"]

const WRITES = new Set(["POST", "PUT", "PATCH", "DELETE"])

const unauthorizedListeners = new Set<() => void>()

export function onUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener)

  return () => {
    unauthorizedListeners.delete(listener)
  }
}

const writesSendJson: Middleware = {
  onRequest({ request }) {
    if (!WRITES.has(request.method) || request.body !== null) {
      return undefined
    }

    const headers = new Headers(request.headers)
    headers.set("Content-Type", "application/json")

    return new Request(request, { body: "{}", headers })
  },
}

const problems: Middleware = {
  async onResponse({ response }) {
    if (response.ok) {
      return undefined
    }

    const problem = await problemOf(response)

    if (problem.status === 401 && problem.code === "auth.unauthenticated") {
      for (const listener of [...unauthorizedListeners]) {
        listener()
      }
    }

    throw problem
  },
  onError({ error }) {
    return error instanceof Error && error.name === "AbortError" ? error : networkError()
  },
}

export const api = createClient<paths>({
  baseUrl: apiBaseUrl(),
  credentials: "include",
  cache: "no-store",
  headers: { Accept: "application/json" },
  fetch: (request) => globalThis.fetch(request),
})

api.use(writesSendJson, problems)

export async function dataOf<Data>(request: Promise<{ data?: Data }>): Promise<Data> {
  const { data } = await request

  return data as Data
}
