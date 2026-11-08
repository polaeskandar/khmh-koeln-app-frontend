import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { DirectoryPerson } from "@/features/members/api"
import type { Locale } from "@/i18n/config"
import { apiUrl } from "@test/support/api"
import { openRosterBoard, rosterPeople, thirdClassBoard } from "@test/support/fixtures/board"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { TakeAttendancePage } from "@/features/attendance/take-attendance-page"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))
afterEach(() => vi.restoreAllMocks())

const youth = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f11",
  name: "Youth Meeting",
  tone: 2,
  archived: false,
}

const sundaySchool = thirdClassBoard().session.service

const directoryPerson = (
  n: number,
  firstName: string,
  lastName: string,
  groups: DirectoryPerson["groups"] = []
): DirectoryPerson => ({
  id: `0192f3a4-7b1c-7d2e-8f50-${String(n).padStart(12, "0")}`,
  firstName,
  lastName,
  displayName: null,
  groups,
})

const youthMina = directoryPerson(1, "Mina", "Hanna", [{ service: youth, stage: null }])

function open(
  results: (q: string) => DirectoryPerson[],
  { board = thirdClassBoard(), locale = "en" as Locale } = {}
) {
  search.value = `session=${board.session.id}`
  const queries: string[] = []
  const aborted: string[] = []
  let current = board
  let found: DirectoryPerson[] = []

  server.use(
    http.get(apiUrl(`/sessions/${board.session.id}/attendance`), () => HttpResponse.json(current)),
    http.get(apiUrl("/people/directory"), async ({ request }) => {
      const q = new URL(request.url).searchParams.get("q") ?? ""
      queries.push(q)
      request.signal.addEventListener("abort", () => aborted.push(q))

      if (q === "slow") {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      found = results(q)

      return HttpResponse.json({ items: found })
    }),
    http.put(apiUrl(`/sessions/${board.session.id}/attendance/:person`), ({ params }) => {
      const mark = {
        id: "m-visitor",
        recordedAt: "2026-11-08T12:40:00+01:00",
        recordedBy: { id: "a1", name: "Daniel Mikhail" },
      }

      const { groups, ...person } = found.find((candidate) => candidate.id === params.person)!

      current = {
        ...current,
        notOnRoster: [...current.notOnRoster, { person, mark, placements: groups }],
      }

      return HttpResponse.json(mark, { status: 201 })
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <TakeAttendancePage />
    </SidebarProvider>,
    { locale }
  )

  return { queries, aborted }
}

const searchBox = () => screen.findByRole("textbox")
const addSomeone = () => within(screen.getByRole("region", { name: "Add someone else" }))

test("asks nothing below two letters, then once after the debounce", async () => {
  const { queries } = open(() => [youthMina])
  await userEvent.type(await searchBox(), "m")
  expect(addSomeone().getByText(/Type at least two letters/)).toBeInTheDocument()
  await userEvent.type(await searchBox(), "ina han")
  await waitFor(() => expect(queries).toEqual(["mina han"]))
})

test("a new query aborts the one in flight", async () => {
  const { queries, aborted } = open(() => [])
  await userEvent.type(await searchBox(), "slow")
  await waitFor(() => expect(queries).toEqual(["slow"]))
  await userEvent.clear(await searchBox())
  await userEvent.type(await searchBox(), "quick")
  await waitFor(() => expect(queries).toEqual(["slow", "quick"]))
  await waitFor(() => expect(aborted).toEqual(["slow"]))
})

test("'mina han' lists only the Youth Meeting's Mina Hanna; marking her adds her as a visitor", async () => {
  const rosterMina = rosterPeople[4]
  open(() => [{ ...rosterMina, groups: [{ service: sundaySchool, stage: null }] }, youthMina])
  await userEvent.type(await searchBox(), "mina han")

  const results = await waitFor(() => {
    const items = addSomeone().getAllByRole("listitem")
    expect(items).toHaveLength(1)

    return items
  })

  expect(results[0]).toHaveTextContent("Mina Hanna")
  expect(results[0]).toHaveTextContent("Youth Meeting")
  await userEvent.click(within(results[0]).getByRole("button", { name: "Mark Mina Hanna present" }))
  const visitors = within(await screen.findByRole("region", { name: "Present, not on the roster" }))

  expect(visitors.getAllByRole("listitem").map((row) => row.textContent)).toEqual(
    expect.arrayContaining([expect.stringContaining("Mina HannaYouth Meeting")])
  )

  expect(within(screen.getByTestId("counter-panel")).getByText(/of 14 present/)).toHaveTextContent(
    "· +2 not on the roster"
  )
})

test("twelve matches show eight, and marked people never appear", async () => {
  const twelve = Array.from({ length: 12 }, (_, i) =>
    directoryPerson(10 + i, `Visitor${i}`, "Ghali", [{ service: youth, stage: null }])
  )

  const markedVisitor = thirdClassBoard().notOnRoster[0].person
  open(() => [{ ...markedVisitor, groups: [] }, ...twelve])
  await userEvent.type(await searchBox(), "ghali")
  await waitFor(() => expect(addSomeone().getAllByRole("listitem")).toHaveLength(8))
  expect(addSomeone().queryByText(/Theo Mansour/)).toBeNull()
})

test("on an open roster a marked result lands under Present with its groups", async () => {
  const board = openRosterBoard()

  open(
    () => [
      directoryPerson(30, "Nadia", "Samir", [
        {
          service: sundaySchool,
          stage: { id: "s3", name: "3rd Class", position: 2, archived: false },
        },
      ]),
    ],
    { board }
  )

  await userEvent.type(await searchBox(), "nadia")
  const row = await waitFor(() => addSomeone().getByRole("listitem"))
  expect(row).toHaveTextContent("Sunday School · 3rd Class")
  await userEvent.click(within(row).getByRole("button", { name: "Mark Nadia Samir present" }))
  const present = within(screen.getByRole("region", { name: "Present" }))

  await waitFor(() =>
    expect(
      present
        .getAllByRole("listitem")
        .some((item) => /Nadia Samir.*Sunday School · 3rd Class/.test(item.textContent ?? ""))
    ).toBe(true)
  )
})

test("under ar the no-match sentence keeps a Latin query intact", async () => {
  open(() => [], { locale: "ar" })
  await userEvent.type(await searchBox(), "zz top")
  await waitFor(() => expect(document.body.textContent).toContain("⁨zz top⁩"))
})

test("offline sends no request", async () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false)
  const { queries } = open(() => [youthMina])
  await userEvent.type(await searchBox(), "mina")
  await new Promise((resolve) => setTimeout(resolve, 400))
  expect(queries).toEqual([])
  expect(addSomeone().getByText(/No connection/)).toBeInTheDocument()
})
