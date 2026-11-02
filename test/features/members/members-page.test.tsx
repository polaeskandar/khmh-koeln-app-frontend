import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { SessionProvider } from "@/features/auth/session"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { peopleList, person } from "@test/support/fixtures/people"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { PeopleList } from "@/features/members/api"
import { MembersPage } from "@/features/members/members-page"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))

const sundaySchool = services.items[0]
const thirdClassStage = sundaySchool.stages.find((stage) => stage.name === "3rd Class")!

function open(answer: (url: URL) => PeopleList | Response, locale: Locale = "en") {
  const requests: URLSearchParams[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(me.administrator)),
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.get(apiUrl("/people"), ({ request }) => {
      const url = new URL(request.url)
      requests.push(url.searchParams)
      const result = answer(url)

      return result instanceof Response ? result : HttpResponse.json(result)
    })
  )

  renderWithProviders(
    <SessionProvider>
      <SidebarProvider>
        <MembersPage />
      </SidebarProvider>
    </SessionProvider>,
    { locale }
  )

  return requests
}

const demi = person("Demiana", "Fanous", { displayName: "Demi" })
const nobodyPlaced = { ...person("Sara", "Wissa"), placements: [] }

test("typing sends one request with q and page 1; Clear resets it", async () => {
  const requests = open(() => peopleList([demi]))
  await screen.findAllByText("Demi Fanous")
  await userEvent.type(screen.getByRole("textbox", { name: "Search people" }), "mina han")
  await waitFor(() => expect(requests.at(-1)?.get("q")).toBe("mina han"))
  expect(requests.filter((params) => params.get("q") === "mina han")).toHaveLength(1)
  expect(requests.at(-1)?.get("page")).toBe("1")
  await userEvent.click(screen.getByRole("button", { name: "Clear search" }))
  expect(screen.getByRole("textbox", { name: "Search people" })).toHaveValue("")
  expect(requests.every((params) => params.get("page") === "1")).toBe(true)
})

test("a stage filter sends stageId with q; page 2 shows the range", async () => {
  const requests = open((url) =>
    peopleList(
      Array.from({ length: 25 }, (_, i) => person(`P${i}`, "Saad")),
      { page: Number(url.searchParams.get("page") ?? 1), total: 121 }
    )
  )

  await screen.findByText("Showing 1–25 of 121 people")

  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Service" }),
    "Sunday School · 3rd Class"
  )

  await userEvent.type(screen.getByRole("textbox", { name: "Search people" }), "saad")
  await waitFor(() => expect(requests.at(-1)?.get("q")).toBe("saad"))
  expect(requests.at(-1)?.get("stageId")).toBe(thirdClassStage.id)
  await userEvent.click(screen.getByRole("button", { name: "Next page" }))
  expect(await screen.findByText("Showing 26–50 of 121 people")).toBeInTheDocument()
  expect(requests.at(-1)?.get("page")).toBe("2")
})

test("a display name shows the full name under it; no placements read No service", async () => {
  open(() => peopleList([demi, nobodyPlaced]))
  const table = within(await screen.findByRole("table"))
  expect(table.getByText("Demiana Fanous")).toBeInTheDocument()
  expect(table.getAllByRole("row")[2]).toHaveTextContent("No service")
  expect(table.getAllByRole("row")[1]).toHaveTextContent("3rd Class (Sunday School)")
})

test("403 shows no access; empty results show the right state", async () => {
  open(() => problem(403, "forbidden"))
  expect(await screen.findByText("Not allowed")).toBeInTheDocument()
})

test("empty results say Nobody here, or Nobody matches the query", async () => {
  open(() => peopleList([]))
  expect(await screen.findAllByText("Nobody here")).not.toHaveLength(0)
  await userEvent.type(screen.getByRole("textbox", { name: "Search people" }), "zz")
  expect(await screen.findAllByText("Nobody matches “zz”")).not.toHaveLength(0)
})

test("in Arabic the phone rows join groups with the Arabic comma", async () => {
  const twoGroups = {
    ...demi,
    placements: [...demi.placements, { ...demi.placements[0], membershipId: "m2", stage: null }],
  }

  open(() => peopleList([twoGroups]), "ar")
  const list = within(await screen.findByRole("list", { name: "المخدومون" }))
  expect(list.getByRole("listitem")).toHaveTextContent("3rd Class (Sunday School)، Sunday School")
})
