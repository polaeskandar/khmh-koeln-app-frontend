import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { peopleList, person } from "@test/support/fixtures/people"
import { THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { StageOverview } from "@/features/stages/stage-layout"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  search.value = `id=${THIRD_CLASS_ID}`
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => vi.restoreAllMocks())

const fourteen = [
  person("Kirollos", "Iskander", { displayName: "Kiro", startsOn: "2026-11-08" }),
  person("Mina", "Hanna"),
  ...Array.from({ length: 12 }, (_, i) => person(`Child${i + 1}`, "Girgis")),
]

function open(people: (url: URL) => Response, locale: Locale = "en") {
  const pages: string[] = []

  server.use(
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}`), () => HttpResponse.json(thirdClass)),
    http.get(apiUrl("/people"), ({ request }) => {
      const url = new URL(request.url)
      pages.push(`${url.searchParams.get("stageId")}:${url.searchParams.get("page")}`)

      return people(url)
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <StageOverview />
    </SidebarProvider>,
    { locale }
  )

  return pages
}

const members = async () =>
  within((await screen.findByRole("heading", { name: /^Members/ })).closest("section")!)

test("lists the roster in API order with the preferred name and since when", async () => {
  const pages = open(() => HttpResponse.json(peopleList(fourteen)))
  const section = await members()
  expect(await section.findAllByRole("listitem")).toHaveLength(14)
  expect(section.getByRole("heading", { name: "Members (14)" })).toBeInTheDocument()
  const [kiro, mina] = section.getAllByRole("listitem")
  expect(kiro).toHaveTextContent("Kiro Iskander")
  expect(kiro).toHaveTextContent("Kirollos Iskander · since Sun 8 Nov 2026")
  expect(mina).toHaveTextContent(/^MHMina Hannasince Sun 6 Sep 2026$/)
  expect(pages).toEqual([`${THIRD_CLASS_ID}:1`])
})

test("says since in German", async () => {
  open(() => HttpResponse.json(peopleList(fourteen)), "de")

  const section = within(
    (await screen.findByRole("heading", { name: /^Mitglieder/ })).closest("section")!
  )

  expect((await section.findAllByRole("listitem"))[0]).toHaveTextContent(
    "Kirollos Iskander · seit So., 8. Nov. 2026"
  )
})

test("pages through more than 25 members", async () => {
  const pageOne = Array.from({ length: 25 }, (_, i) => person(`First${i}`, "Saad"))
  const pageTwo = Array.from({ length: 5 }, (_, i) => person(`Second${i}`, "Saad"))

  const pages = open((url) =>
    HttpResponse.json(
      url.searchParams.get("page") === "2"
        ? peopleList(pageTwo, { page: 2, total: 30 })
        : peopleList(pageOne, { total: 30 })
    )
  )

  const section = await members()
  expect(await section.findByText("Showing 1–25 of 30")).toBeInTheDocument()
  expect(section.getByRole("button", { name: "Previous page" })).toBeDisabled()
  await userEvent.click(section.getByRole("button", { name: "Next page" }))
  expect(await section.findByText("Showing 26–30 of 30")).toBeInTheDocument()
  expect(section.getAllByRole("listitem")).toHaveLength(5)
  expect(pages).toEqual([`${THIRD_CLASS_ID}:1`, `${THIRD_CLASS_ID}:2`])
})

test("another stage starts on its first page", async () => {
  const otherId = "0192f3a4-7b1c-7d2e-8f3b-0000000009ff"
  const pageOne = Array.from({ length: 25 }, (_, i) => person(`First${i}`, "Saad"))
  const pages: string[] = []

  server.use(
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}`), () => HttpResponse.json(thirdClass)),
    http.get(apiUrl(`/stages/${otherId}`), () =>
      HttpResponse.json({ ...thirdClass, id: otherId, name: "4th Class" })
    ),
    http.get(apiUrl("/people"), ({ request }) => {
      const url = new URL(request.url)
      pages.push(`${url.searchParams.get("stageId")}:${url.searchParams.get("page")}`)

      return HttpResponse.json(
        url.searchParams.get("page") === "2"
          ? peopleList(pageOne.slice(0, 5), { page: 2, total: 30 })
          : peopleList(pageOne, { total: 30 })
      )
    })
  )

  const page = () => (
    <SidebarProvider>
      <StageOverview />
    </SidebarProvider>
  )

  const view = renderWithProviders(page())
  await screen.findByText("Showing 1–25 of 30")
  search.value = `id=${otherId}`
  view.rerender(page())
  expect(await screen.findByRole("heading", { name: "4th Class" })).toBeInTheDocument()
  await userEvent.click(await (await members()).findByRole("button", { name: "Next page" }))
  await screen.findByText("Showing 26–30 of 30")
  search.value = `id=${THIRD_CLASS_ID}`
  view.rerender(page())
  expect(await screen.findByRole("heading", { name: thirdClass.name })).toBeInTheDocument()
  expect(await screen.findByText("Showing 1–25 of 30")).toBeInTheDocument()
  expect(pages).not.toContain(`${THIRD_CLASS_ID}:2`)
})

test("a 403 keeps the header and tabs but shows no names", async () => {
  open(() => problem(403, "forbidden"))
  expect(await screen.findByText("Not allowed")).toBeInTheDocument()
  expect(screen.getByRole("heading", { level: 1, name: "3rd Class" })).toBeInTheDocument()
  expect((await members()).queryByRole("listitem")).toBeNull()
})

test("an empty roster says so", async () => {
  open(() => HttpResponse.json(peopleList([])))
  expect(await screen.findByText("No members yet")).toBeInTheDocument()

  expect(
    screen.getByText("Add the children or people of this stage to build its roster.")
  ).toBeInTheDocument()
})

test("Retry after a 500 asks again", { timeout: 15_000 }, async () => {
  let failing = true
  open(() => (failing ? problem(500, "internal") : HttpResponse.json(peopleList(fourteen))))
  const retry = await screen.findByRole("button", { name: "Try again" }, { timeout: 10_000 })
  failing = false
  await userEvent.click(retry)
  expect(await (await members()).findAllByRole("listitem")).toHaveLength(14)
})
