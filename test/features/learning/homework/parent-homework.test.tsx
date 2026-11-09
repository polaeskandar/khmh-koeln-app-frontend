import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import type { Locale } from "@/i18n/config"
import { isolate } from "@/lib/bidi"
import { apiUrl, problem } from "@test/support/api"
import { homeworkOf, MIMI_ID, MINA_ID, mimi, mina } from "@test/support/fixtures/parent"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { ChildSummary } from "@/features/people/children/api"
import type { ParentTask } from "@/features/learning/homework/api"
import { ParentHomework } from "@/features/learning/homework/parent-homework"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  search.value = ""
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
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

test("a failed children refresh after an unlink offers to try again", async () => {
  search.value = `child=${MINA_ID}`
  let reads = 0

  open({ lists: { [MIMI_ID]: homeworkOf[MIMI_ID] } })

  server.use(
    http.get(apiUrl("/parent/children"), () =>
      ++reads === 1
        ? HttpResponse.json({ today: "2026-11-08", items: [mimi, mina] })
        : problem(403, "forbidden")
    )
  )

  expect((await screen.findAllByRole("button", { name: "Try again" })).length).toBeGreaterThan(0)
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

const drawing = homeworkOf[MINA_ID].todo[0]
const reading = homeworkOf[MINA_ID].done[0]

const completion = (task: ParentTask) =>
  apiUrl(`/parent/children/${MINA_ID}/homework/${task.id}/completion`)

const square = (title: string) =>
  screen.findByRole("button", { name: `Mark “${isolate(title)}” done for ${isolate("Mina")}` })

test("tapping a card's square reports the task done once, in place, and refreshes the lists", async () => {
  search.value = `child=${MINA_ID}`
  const requested = open()
  const puts: unknown[] = []

  server.use(
    http.put(completion(drawing), async ({ request }) => {
      puts.push(await request.json())

      return HttpResponse.json(
        {
          done: true,
          completedAt: "2026-11-08T11:08:00Z",
          completedBy: "Hoda Farag",
          completedByYou: true,
        },
        { status: 201 }
      )
    })
  )

  const tick = await square(drawing.title)
  expect(tick).toHaveAttribute("aria-pressed", "false")
  await region("Done")
  const reads = requested.length
  await userEvent.dblClick(tick)
  expect(tick).toHaveAttribute("aria-pressed", "true")
  const card = screen.getByRole("link", { name: /Draw the shepherd and his sheep/ })
  await vi.waitFor(() => expect(card).toHaveTextContent("Done · reported by you today at 12:08"))
  expect(puts).toEqual([{}])
  await vi.waitFor(() => expect(requested.length).toBe(reads + 2))
  expect(toast.error).not.toHaveBeenCalled()
})

test("tapping a done card's square takes the report back and says so", async () => {
  search.value = `child=${MINA_ID}`
  open()
  const deletes: unknown[] = []

  server.use(
    http.delete(completion(reading), async ({ request }) => {
      deletes.push(await request.json())

      return new HttpResponse(null, { status: 204 })
    })
  )

  const tick = await square(reading.title)
  expect(tick).toHaveAttribute("aria-pressed", "true")
  await userEvent.dblClick(tick)
  await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("Marked as not done for Mina."))
  expect(tick).toHaveAttribute("aria-pressed", "false")
  expect(deletes).toEqual([{}])
})

test("a refused report empties the square again and says why", async () => {
  search.value = `child=${MINA_ID}`
  open()
  server.use(http.put(completion(drawing), () => problem(404, "homework.notAvailable")))
  const tick = await square(drawing.title)
  await userEvent.click(tick)

  await vi.waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("This homework is not available.")
  )

  await vi.waitFor(() => expect(tick).toHaveAttribute("aria-pressed", "false"))
  expect(tick).not.toHaveAttribute("aria-disabled")
})

test("the square sits beside the link, which still opens the task", async () => {
  search.value = `child=${MINA_ID}`
  open()
  const tick = await square(drawing.title)
  const card = screen.getByRole("link", { name: /Draw the shepherd and his sheep/ })

  expect(card).toHaveAttribute("href", `/parent/homework/view/?id=${drawing.id}&child=${MINA_ID}`)

  expect(card).not.toContainElement(tick)
  expect(tick.closest("a")).toBeNull()
  expect(tick).toHaveAttribute("type", "button")
  expect(tick).toHaveClass("min-h-11", "min-w-11", "focus-visible:ring-2")
})
