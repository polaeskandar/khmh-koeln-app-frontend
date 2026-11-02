import { screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { homeworkOf, MIMI_ID, MINA_ID, mimi, mina } from "@test/support/fixtures/parent"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { ChildSummary, ParentTask } from "@/features/parent/api"
import { ParentHomework } from "@/features/parent/parent-homework"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  search.value = ""
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => vi.restoreAllMocks())

type Lists = Record<string, { todo: readonly ParentTask[]; done: readonly ParentTask[] }>

function open({
  items = [mimi, mina],
  lists = homeworkOf as Lists,
  locale = "en",
}: { items?: ChildSummary[] | (() => ChildSummary[]); lists?: Lists; locale?: Locale } = {}) {
  const requested: string[] = []
  const children = typeof items === "function" ? items : () => items

  server.use(
    http.get(apiUrl("/parent/children"), () =>
      HttpResponse.json({ today: "2026-11-08", items: children() })
    ),
    http.get(apiUrl("/parent/children/:child/homework"), ({ params, request }) => {
      const child = String(params.child)
      const state = new URL(request.url).searchParams.get("state") as "todo" | "done"
      requested.push(`${child}:${state}`)
      const list = lists[child]

      return list
        ? HttpResponse.json({ today: "2026-11-08", items: list[state] })
        : problem(404, "notFound.person")
    })
  )

  renderWithProviders(<ParentHomework />, { locale })

  return requested
}

const region = async (name: string) => within(await screen.findByRole("region", { name }))

test("lists what is to do in API order and everything done", async () => {
  search.value = `child=${MINA_ID}`
  open()

  expect(
    await screen.findByText("Everything the servants of ⁨3rd Class⁩ gave ⁨Mina⁩.")
  ).toBeInTheDocument()

  const toDo = (await region("To do")).getAllByRole("link")

  expect(toDo.map((a) => a.querySelector("[dir=auto]")!.textContent)).toEqual([
    "Draw the shepherd and his sheep",
    "Learn the memory verse",
    "Pray together",
  ])

  expect(toDo[0]).toHaveTextContent("Due today")
  expect(toDo[1]).toHaveTextContent("Due Sun 22 Nov")
  expect(screen.getByRole("heading", { name: /^To do\s*3$/ })).toBeInTheDocument()
  expect((await region("Done")).getAllByRole("link")).toHaveLength(6)
  expect(screen.getByRole("heading", { name: /^Done\s*6$/ })).toBeInTheDocument()
})

test("the switcher links to each child's homework and loads the chosen child", async () => {
  search.value = `child=${MIMI_ID}`
  const requested = open()
  const nav = within(await screen.findByRole("navigation", { name: "Children" }))

  expect(nav.getByRole("link", { name: /Mina/ })).toHaveAttribute(
    "href",
    `/parent/homework/?child=${MINA_ID}`
  )

  expect((await region("To do")).getByText("Colour the ark")).toBeInTheDocument()
  expect(requested.sort()).toEqual([`${MIMI_ID}:done`, `${MIMI_ID}:todo`])
})

test("an unlinked child in the address falls back to the first without asking for it", async () => {
  search.value = "child=0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec999"
  const requested = open()
  expect((await region("To do")).getByText("Colour the ark")).toBeInTheDocument()
  expect(requested.every((r) => r.startsWith(MIMI_ID))).toBe(true)
})

test("empty lists say so", async () => {
  search.value = `child=${MINA_ID}`
  open({ lists: { [MINA_ID]: { todo: [], done: [] } } })
  expect(await screen.findByText("Nothing to do for Mina right now.")).toBeInTheDocument()
  expect(await screen.findByText("Nothing ticked off yet.")).toBeInTheDocument()
})

test("without children there is no list and no homework request", async () => {
  const requested = open({ items: [] })
  expect(await screen.findByText("No child linked yet.")).toBeInTheDocument()
  expect(screen.queryByRole("region")).not.toBeInTheDocument()
  expect(requested).toEqual([])
})

test("a child unlinked meanwhile refetches the children and shows the first left", async () => {
  search.value = `child=${MINA_ID}`
  let reads = 0

  open({
    items: () => (++reads === 1 ? [mimi, mina] : [mimi]),
    lists: { [MIMI_ID]: homeworkOf[MIMI_ID] },
  })

  expect((await region("To do")).getByText("Colour the ark")).toBeInTheDocument()
  expect(reads).toBeGreaterThanOrEqual(2)
  expect(screen.queryByRole("link", { name: /Mina/ })).not.toBeInTheDocument()
})

test("in Arabic stage names sit in bdi", async () => {
  search.value = `child=${MINA_ID}`
  open({ locale: "ar" })
  await screen.findByText("Draw the shepherd and his sheep")
  const card = screen.getByText("Draw the shepherd and his sheep").closest("a")!

  expect([...card.querySelectorAll("bdi")].map((b) => b.textContent)).toEqual([
    "The Good Shepherd",
    "3rd Class",
  ])
})
