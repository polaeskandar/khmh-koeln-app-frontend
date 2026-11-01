import { useQuery } from "@tanstack/react-query"
import { act, screen } from "@testing-library/react"
import { http } from "msw"
import { afterEach, beforeEach, expect, test } from "vitest"
import { vi } from "vitest"

import { apiUrl, problem, renderWithQuery } from "@test/support/api"
import { server } from "@test/support/msw"

import { api, dataOf } from "@/lib/api/client"

function Services() {
  const query = useQuery({ queryKey: ["services"], queryFn: () => dataOf(api.GET("/services")) })

  return <p>{query.status}</p>
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

test.each([
  [404, "notFound.route", 1],
  [403, "forbidden", 1],
  [503, "unavailable", 3],
  [500, "internal", 3],
])("a %i is tried %i time(s) in all", async (status, code, attempts) => {
  let requests = 0

  server.use(
    http.get(apiUrl("/services"), () => {
      requests++

      return problem(status, code)
    })
  )

  renderWithQuery(<Services />)
  await act(() => vi.advanceTimersByTimeAsync(60_000))
  expect(await screen.findByText("error")).toBeInTheDocument()
  expect(requests).toBe(attempts)
})
