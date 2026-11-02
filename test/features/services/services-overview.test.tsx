import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { ServicesOverview } from "@/features/services/services-overview"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

function overview(locale: Locale = "en") {
  let requests = 0

  server.use(
    http.get(apiUrl("/services"), ({ request }) => {
      requests++
      expect(new URL(request.url).searchParams.get("status")).toBe("all")

      return HttpResponse.json(services)
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <ServicesOverview />
    </SidebarProvider>,
    { locale }
  )

  return () => requests
}

const table = () => within(screen.getByRole("table"))

const serviceNames = () =>
  table()
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].querySelector("a")?.textContent)

describe("tabs", () => {
  test("count every service once request answers", async () => {
    const requests = overview()

    expect(await screen.findByRole("tab", { name: "Active (7)" })).toHaveAttribute(
      "aria-selected",
      "true"
    )

    expect(screen.getByRole("tab", { name: "Archived (1)" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "All (8)" })).toBeInTheDocument()
    expect(serviceNames()).toHaveLength(7)
    expect(requests()).toBe(1)
  })

  test("Archived lists only the archived service, with its badge and date", async () => {
    overview()
    await userEvent.click(await screen.findByRole("tab", { name: "Archived (1)" }))
    expect(serviceNames()).toEqual(["Choir"])
    expect(table().getByText("Archived")).toHaveAttribute("title", "Archived Sun 6 Sep 2026")
  })
})

describe("search", () => {
  test("finds a service through a stage's name and ignores case", async () => {
    overview()
    const search = await screen.findByRole("textbox", { name: "Search services" })
    await userEvent.type(search, "kinder")
    expect(serviceNames()).toEqual(["Sunday School"])
    await userEvent.clear(search)
    await userEvent.type(search, "SUNDAY")
    expect(serviceNames()).toEqual(["Sunday School"])
  })

  test("no match says so, and Clear search brings the list back", async () => {
    overview()
    await userEvent.type(await screen.findByRole("textbox", { name: "Search services" }), "xyz")
    expect(table().getByText("No service matches “xyz”")).toBeInTheDocument()
    await userEvent.click(table().getByRole("button", { name: "Clear search" }))
    expect(serviceNames()).toHaveLength(7)
  })
})

describe("columns", () => {
  test("a service without stages shows None; stage names are the count's title", async () => {
    overview()
    await screen.findByRole("tab", { name: "Active (7)" })
    const row = (name: string) => table().getByRole("link", { name }).closest("tr") as HTMLElement
    expect(within(row("Youth Meeting")).getByText("None")).toBeInTheDocument()

    expect(within(row("Sunday School")).getByText("3")).toHaveAttribute(
      "title",
      "Kindergarten, 1st Class, 3rd Class"
    )
  })

  test("Members sorts numerically", async () => {
    overview()
    await screen.findByRole("tab", { name: "Active (7)" })
    await userEvent.click(table().getByRole("button", { name: "Sort by Members" }))

    expect(serviceNames()).toEqual([
      "Coptic Course",
      "Deacons' School",
      "Youth Meeting",
      "Scouts",
      "Family Meeting",
      "Sunday School",
      "Bible Study",
    ])
  })

  test("links each service to its page", async () => {
    overview()
    await screen.findByRole("tab", { name: "Active (7)" })

    expect(table().getByRole("link", { name: "Sunday School" })).toHaveAttribute(
      "href",
      `/services/view/?id=${services.items[0].id}`
    )
  })
})

test("in Arabic the stage names are joined by '، '", async () => {
  overview("ar")
  await screen.findAllByRole("tab")
  expect(table().getByText("3")).toHaveAttribute("title", "Kindergarten، 1st Class، 3rd Class")
})

test("phones get one linked card per service", async () => {
  overview()
  const cards = within(await screen.findByRole("list", { name: "Services" }))
  expect(cards.getAllByRole("link")).toHaveLength(7)

  expect(cards.getByRole("link", { name: /Sunday School/ })).toHaveTextContent(
    "3 stages · 42 members"
  )
})

test("more than 50 services page through the table", async () => {
  const many = Array.from({ length: 51 }, (_, i) => ({
    ...services.items[1],
    id: `0192f3a4-7b1c-7d2e-8f3c-${String(i).padStart(12, "0")}`,
    name: `Group ${String(i + 1).padStart(2, "0")}`,
  }))

  server.use(http.get(apiUrl("/services"), () => HttpResponse.json({ ...services, items: many })))

  renderWithProviders(
    <SidebarProvider>
      <ServicesOverview />
    </SidebarProvider>
  )

  expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument()
  expect(serviceNames()).not.toContain("Group 51")
  await userEvent.click(screen.getByRole("button", { name: "Next page" }))
  expect(serviceNames()).toEqual(["Group 51"])
})

test("Retry refetches after a failed request", async () => {
  let fail = true

  server.use(
    http.get(apiUrl("/services"), () =>
      fail ? problem(500, "internal") : HttpResponse.json(services)
    )
  )

  renderWithProviders(
    <SidebarProvider>
      <ServicesOverview />
    </SidebarProvider>
  )

  const retry = await screen.findByRole("button", { name: "Try again" }, { timeout: 8000 })
  fail = false
  await userEvent.click(retry)
  expect(await screen.findByRole("tab", { name: "Active (7)" })).toBeInTheDocument()
}, 10000)

test("there is no Leaders column on any screen size", async () => {
  server.use(http.get(apiUrl("/services"), () => HttpResponse.json(services)))

  renderWithProviders(
    <SidebarProvider>
      <ServicesOverview />
    </SidebarProvider>
  )

  await screen.findAllByRole("link", { name: "Sunday School" })
  expect(screen.queryByText(/Leaders/)).toBeNull()
})
