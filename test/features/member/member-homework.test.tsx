import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { nevineHomework } from "@test/support/fixtures/member"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { MemberTaskDetail } from "@/features/member/api"
import { MemberHomework } from "@/features/member/member-homework"
import { MemberTaskPage } from "@/features/member/member-task"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

const task = nevineHomework.todo[0]!
const path = `/member/homework/${task.id}`

beforeEach(() => {
  search.value = `id=${task.id}`
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const detail = (extra: Partial<MemberTaskDetail["task"]> = {}): MemberTaskDetail => ({
  today: "2026-11-08",
  task: {
    ...task,
    instructions: "Write each letter five times.",
    resources: [{ label: "The Coptic alphabet (chart)", url: "https://example.org/alphabet" }],
    ...extra,
  },
  lesson: {
    title: "The first eight letters",
    teachingDate: "2026-11-02",
    passage: null,
    memoryVerse: null,
  },
})

function openTask(data: MemberTaskDetail | (() => Response), locale: Locale = "en") {
  let reads = 0

  server.use(
    http.get(apiUrl(path), () => {
      reads++

      return typeof data === "function" ? data() : HttpResponse.json(data)
    })
  )

  renderWithProviders(<MemberTaskPage />, { locale })

  return { reads: () => reads }
}

const markDone = () => screen.findByRole("button", { name: "Mark as done" })

test("the list shows what is to do and what was done", async () => {
  server.use(
    http.get(apiUrl("/member/homework"), ({ request }) => {
      const state = new URL(request.url).searchParams.get("state") as "todo" | "done"

      return HttpResponse.json({ today: "2026-11-08", items: nevineHomework[state] })
    })
  )

  renderWithProviders(<MemberHomework />)
  expect(screen.getByText("Everything the servants of your groups gave you.")).toBeInTheDocument()
  const toDo = within(await screen.findByRole("region", { name: "To do" }))

  expect(toDo.getByRole("link", { name: /Write the first eight letters/ })).toHaveAttribute(
    "href",
    `/member/homework/view/?id=${task.id}`
  )

  const done = within(await screen.findByRole("region", { name: "Done" }))

  expect(done.getByRole("link", { name: /Say the Easter greeting at home/ })).toHaveTextContent(
    "Done · reported by you on Thu 29 Oct at 20:15"
  )
})

test("an unlinked account reads the not-linked text", async () => {
  server.use(http.get(apiUrl("/member/homework"), () => problem(403, "forbidden")))
  renderWithProviders(<MemberHomework />)

  expect(
    await screen.findByText(
      "Your account isn’t linked to your record yet. The church office does this."
    )
  ).toBeInTheDocument()
})

test("the task page reads For you with the stage and the resource link", async () => {
  openTask(detail())
  await markDone()
  expect(screen.getByText("Level 1").parentElement).toHaveTextContent(/^For you · Level 1$/)
  expect(screen.getByText("Tap when you’ve done it. You can undo it.")).toBeInTheDocument()

  expect(screen.getByRole("link", { name: "The Coptic alphabet (chart)" })).toHaveAttribute(
    "rel",
    "noreferrer"
  )

  expect(screen.getByRole("link", { name: "Homework" })).toHaveAttribute(
    "href",
    "/member/homework/"
  )
})

test("Mark as done shows the panel at once and sends one PUT", async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))
  const puts: unknown[] = []
  openTask(detail())

  server.use(
    http.put(apiUrl(`${path}/completion`), async ({ request }) => {
      puts.push(await request.json())
      await gate

      return HttpResponse.json(
        {
          done: true,
          completedAt: "2026-11-08T11:08:00Z",
          completedBy: "Nevine Boulos",
          completedByYou: true,
        },
        { status: 201 }
      )
    })
  )

  await userEvent.dblClick(await markDone())
  expect(screen.getByRole("status")).toHaveTextContent("Saving…")
  release()
  expect(await screen.findByText("You reported it today at 12:08.")).toBeInTheDocument()
  expect(puts).toEqual([{}])
})

test("a parent's report names the parent", async () => {
  openTask(
    detail({
      done: true,
      completedAt: "2026-11-08T09:30:00Z",
      completedBy: "Hoda Farag",
      completedByYou: false,
    })
  )

  expect(await screen.findByText("Hoda Farag reported it today at 10:30.")).toBeInTheDocument()
})

test("a 404 on Mark as done reverts and toasts", async () => {
  openTask(detail())
  server.use(http.put(apiUrl(`${path}/completion`), () => problem(404, "homework.notAvailable")))
  await userEvent.click(await markDone())

  await vi.waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("This homework is not available.")
  )

  expect(await markDone()).toBeEnabled()
})

test("Undo sends one DELETE, toasts and refetches", async () => {
  const deletes: unknown[] = []

  const page = openTask(
    detail({ done: true, completedAt: "2026-11-08T11:08:00Z", completedByYou: true })
  )

  server.use(
    http.delete(apiUrl(`${path}/completion`), async ({ request }) => {
      deletes.push(await request.json())

      return new HttpResponse(null, { status: 204 })
    })
  )

  await userEvent.dblClick(await screen.findByRole("button", { name: "Undo" }))
  expect(await markDone()).toBeInTheDocument()
  await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("Marked as not done."))
  expect(deletes).toEqual([{}])
  await vi.waitFor(() => expect(page.reads()).toBe(2))
})

test.each([
  ["a 404", `id=${task.id}`],
  ["a missing id", ""],
  ["a malformed id", "id=nope"],
])("%s shows the same not-available page", async (_, query) => {
  search.value = query
  openTask(() => problem(404, "homework.notAvailable"))
  expect(await screen.findByText("This page isn’t available")).toBeInTheDocument()

  expect(screen.getByRole("link", { name: "See your homework" })).toHaveAttribute(
    "href",
    "/member/homework/"
  )
})

test("in Arabic the button spans the width on phones", async () => {
  openTask(detail(), "ar")
  const buttons = await screen.findAllByRole("button")
  expect(buttons.find((b) => b.classList.contains("h-12"))).toHaveClass("w-full")
})
