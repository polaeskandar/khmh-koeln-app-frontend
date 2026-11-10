import { QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { HttpResponse } from "msw"
import type { ReactElement } from "react"

import { apiBaseUrl } from "@/lib/env"
import { makeTestQueryClient } from "@test/support/providers"

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
  const client = makeTestQueryClient()

  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) }
}
