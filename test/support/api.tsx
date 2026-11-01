import { QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { HttpResponse } from "msw"
import type { ReactElement } from "react"

import { makeQueryClient } from "@/lib/api/query-provider"
import { apiBaseUrl } from "@/lib/env"

export const apiUrl = (path: string) => `${apiBaseUrl()}${path}`

export function problem(
  status: number,
  code: string,
  {
    params = {},
    headers,
    ...members
  }: { params?: object; headers?: Record<string, string> } & Record<string, unknown> = {}
) {
  return HttpResponse.json(
    { status, code, params, ...members },
    { status, headers: { "Content-Type": "application/problem+json", ...headers } }
  )
}

export function renderWithQuery(ui: ReactElement) {
  const client = makeQueryClient()

  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) }
}
