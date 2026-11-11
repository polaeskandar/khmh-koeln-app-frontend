import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SessionProvider } from "@/features/identity/auth/session"
import type { Locale } from "@/i18n/config"
import type { Me } from "@/features/identity/auth/api"
import { isolate } from "@/lib/bidi"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { homeworkOf, MIMI_ID, MINA_ID, mimi, mina } from "@test/support/fixtures/parent"
import { expectMirroredInRtl, expectScrollsSideways } from "@test/support/layout"
import { server } from "@test/support/msw"
import { address } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import type { ChildSummary } from "@/features/people/children/api"
import { ParentHomePage } from "@/features/portals/parent/parent-home-page"

const hoda: Me = { ...me.parent, account: { ...me.parent.account, displayName: "Hoda Farag" } }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-08T11:08:00Z") })
})

afterEach(() => {
  vi.useRealTimers()
})

function open(items: ChildSummary[] = [mimi, mina], locale: Locale = "en") {
  const requested: string[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(hoda)),
    http.get(apiUrl("/parent/children"), () => HttpResponse.json({ today: "2026-11-08", items })),
    http.get(apiUrl("/parent/children/:child/homework"), ({ params, request }) => {
      const child = String(params.child)
      const state = new URL(request.url).searchParams.get("state") as "todo" | "done"
      requested.push(`${child}:${state}`)
      const lists = homeworkOf[child as keyof typeof homeworkOf]

      return HttpResponse.json({ today: "2026-11-08", items: lists[state] })
    })
  )

  renderWithProviders(
    <SessionProvider>
      <ParentHomePage />
    </SessionProvider>,
    { locale }
  )

  return requested
}

const switcher = async () => within(await screen.findByRole("navigation", { name: "Children" }))

test("greets the parent and shows each child with what is to do", async () => {
  open()
  expect(await screen.findByRole("heading", { name: "Good afternoon, Hoda" })).toBeInTheDocument()
  expect(screen.getByText(/^Sunday 8 November 2026 · /)).toBeInTheDocument()
  const links = (await switcher()).getAllByRole("link")
  expect(links[0]).toHaveTextContent("Mimi1st Class · 1 to do")
  expect(links[0]).toHaveAttribute("aria-current", "page")
  expect(links[1]).toHaveTextContent("Mina3rd Class · 3 to do")
  expect(links[1]).toHaveAttribute("href", `/parent/?child=${MINA_ID}`)
})

test("lists the selected child's tasks, due first", async () => {
  address.set(`child=${MINA_ID}`)
  open()
  const list = within(await screen.findByRole("region", { name: "To do for Mina" }))
  const first = list.getAllByRole("link")[0]!
  expect(first).toHaveTextContent("Draw the shepherd and his sheep")
  expect(first).toHaveTextContent("The Good Shepherd · 3rd Class")
  expect(first).toHaveTextContent("Due today")
  expect(first.getAttribute("href")).toMatch(/^\/parent\/homework\/view\/\?id=.+&child=/)
  expect((await switcher()).getAllByRole("link")[1]).toHaveAttribute("aria-current", "page")
})

test.each([
  ["an unlinked child", "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec999"],
  ["a malformed id", "not-a-uuid"],
])("%s in the address shows the first child without asking for it", async (_, child) => {
  address.set(`child=${child}`)
  const requested = open()
  expect(await screen.findByRole("region", { name: "To do for Mimi" })).toBeInTheDocument()
  expect(requested.every((r) => r.startsWith(MIMI_ID))).toBe(true)
})

test("without linked children it says so and asks for no homework", async () => {
  const requested = open([])
  expect(await screen.findByText("No child linked yet")).toBeInTheDocument()
  expect(screen.queryByRole("navigation", { name: "Children" })).not.toBeInTheDocument()
  expect(requested).toEqual([])
})

test.each([
  ["2026-11-08T10:59:00Z", "Good morning, Hoda"],
  ["2026-11-08T11:00:00Z", "Good afternoon, Hoda"],
  ["2026-11-08T16:59:00Z", "Good afternoon, Hoda"],
  ["2026-11-08T17:00:00Z", "Good evening, Hoda"],
])("at %s Berlin time it says %s", async (now, greeting) => {
  vi.setSystemTime(new Date(now))
  open()
  expect(await screen.findByRole("heading", { name: greeting })).toBeInTheDocument()
})

test("done tasks say who reported them, five at most", async () => {
  address.set(`child=${MINA_ID}`)
  open()
  const done = within(await screen.findByRole("region", { name: "Done recently" }))
  const cards = done.getAllByRole("link")
  expect(cards).toHaveLength(5)
  expect(cards[0]).toHaveTextContent("Done · reported by you today at 11:10")
  expect(cards[1]).toHaveTextContent("Done · reported by Nabil Hanna yesterday at 18:20")
  expect(cards[2]).toHaveTextContent("Done · reported by a parent on Sun 1 Nov at 13:47")
})

test("hides Done recently when nothing was done", async () => {
  open()
  await screen.findByRole("region", { name: "To do for Mimi" })
  expect(screen.queryByRole("region", { name: "Done recently" })).not.toBeInTheDocument()
})

test("done homework that fails to load says so instead of looking empty", async () => {
  open()

  server.use(
    http.get(apiUrl("/parent/children/:child/homework"), ({ request }) =>
      new URL(request.url).searchParams.get("state") === "done"
        ? problem(403, "forbidden")
        : HttpResponse.json({ today: "2026-11-08", items: [] })
    )
  )

  await screen.findByRole("region", { name: "To do for Mimi" })
  expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
})

test("a network error offers to try again", async () => {
  let fail = true
  open()

  server.use(
    http.get(apiUrl("/parent/children"), () =>
      fail ? HttpResponse.error() : HttpResponse.json({ today: "2026-11-08", items: [mimi] })
    )
  )

  const retry = await screen.findByRole("button", { name: "Try again" })
  fail = false
  await userEvent.click(retry)
  expect(await screen.findByRole("region", { name: "To do for Mimi" })).toBeInTheDocument()
})

test("the square on a card ticks the task off for the selected child", async () => {
  address.set(`child=${MINA_ID}`)
  open()
  const task = homeworkOf[MINA_ID].todo[0]
  const reported: string[] = []

  server.use(
    http.put(apiUrl("/parent/children/:child/homework/:id/completion"), ({ params }) => {
      reported.push(`${String(params.child)}:${String(params.id)}`)

      return HttpResponse.json({
        done: true,
        completedAt: "2026-11-08T11:08:00Z",
        completedBy: "Hoda Farag",
        completedByYou: true,
      })
    })
  )

  const list = within(await screen.findByRole("region", { name: "To do for Mina" }))
  const name = `Mark “${isolate(task.title)}” done for ${isolate("Mina")}`
  await userEvent.click(list.getByRole("button", { name }))
  await vi.waitFor(() => expect(reported).toEqual([`${MINA_ID}:${task.id}`]))
  expect(list.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true")
})

test("in Arabic the switcher scrolls sideways and the chevron turns", async () => {
  open([mimi, mina], "ar")
  const nav = await screen.findByRole("navigation", { name: "الأطفال" })
  expectScrollsSideways(nav)
  await screen.findAllByText("Colour the ark")
  const chevrons = document.querySelectorAll("svg.lucide-chevron-right")
  expect(chevrons).toHaveLength(1)
  expectMirroredInRtl(chevrons[0]!)
})
