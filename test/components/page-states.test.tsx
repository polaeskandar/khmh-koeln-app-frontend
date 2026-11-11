import { useQuery } from "@tanstack/react-query"
import { act, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import { api, dataOf } from "@/lib/api/client"
import { apiUrl, problem } from "@test/support/api"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"
import { QueryState } from "@/components/page-states"

function Service() {
  const query = useQuery({
    queryKey: ["services", "detail", "s1"],
    queryFn: () => dataOf(api.GET("/services/{id}", { params: { path: { id: "s1" } } })),
    retry: false,
  })

  return <QueryState query={query}>{(service) => <h1>{service.name}</h1>}</QueryState>
}

const answer = (response: () => Response | Promise<Response>) => {
  let calls = 0

  server.use(
    http.get(apiUrl("/services/s1"), () => {
      calls++

      return response()
    })
  )

  return () => calls
}

describe("QueryState", () => {
  test("shows the skeleton, then the data", async () => {
    answer(() => HttpResponse.json({ name: "Choir" }))
    const { container } = renderWithProviders(<Service />)
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull()
    expect(await screen.findByRole("heading", { name: "Choir" })).toBeInTheDocument()
  })

  test("a 404 is not found", async () => {
    answer(() => problem(404, "notFound.service"))
    renderWithProviders(<Service />)
    expect(await screen.findByText("This page doesn’t exist")).toBeInTheDocument()
  })

  test("a 403 is no access", async () => {
    answer(() => problem(403, "forbidden"))
    renderWithProviders(<Service />)
    expect(await screen.findByText("Not allowed")).toBeInTheDocument()
    expect(screen.getByText("Your roles don’t allow this.")).toBeInTheDocument()
  })

  test.each([
    ["a 500", () => problem(500, "internal"), "Something went wrong on our side. Try again later."],
    [
      "a failed connection",
      () => HttpResponse.error(),
      "No connection. Check your internet connection and try again.",
    ],
  ])("%s is an error with a retry that refetches", async (_, response, text) => {
    const calls = answer(response)
    renderWithProviders(<Service />)
    expect(await screen.findByText("This couldn’t be loaded.")).toBeInTheDocument()
    expect(screen.getByText(text)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    await act(async () => {})
    expect(calls()).toBe(2)
  })

  test("a background refetch keeps the data visible, even when it fails", async () => {
    let fail = false
    answer(() => (fail ? problem(500, "internal") : HttpResponse.json({ name: "Choir" })))
    const { client } = renderWithProviders(<Service />)
    expect(await screen.findByRole("heading", { name: "Choir" })).toBeInTheDocument()
    fail = true
    await act(() => client.refetchQueries({ queryKey: ["services"] }))
    expect(screen.getByRole("heading", { name: "Choir" })).toBeInTheDocument()
    expect(screen.queryByText("This couldn’t be loaded.")).toBeNull()
  })
})
