import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, expect, test, vi } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { MIMI_ID, MINA_ID, mimi, mina } from "@test/support/fixtures/parent"
import { server } from "@test/support/msw"
import { address } from "@test/support/navigation"
import { testProviders } from "@test/support/providers"

import { type ChildSummary, parentChildrenQuery } from "@/features/people/children/api"
import { type ParentTaskDetail } from "@/features/learning/homework/api"
import { ParentTaskPage } from "@/features/learning/homework/parent-task"

const TASK_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ed001"
const path = `/parent/children/${MINA_ID}/homework/${TASK_ID}`

beforeEach(() => {
  address.set(`id=${TASK_ID}&child=${MINA_ID}`)
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

const detail = (
  task: Partial<ParentTaskDetail["task"]> = {},
  extra: Partial<ParentTaskDetail> = {}
): ParentTaskDetail => ({
  today: "2026-11-08",
  child: { id: MINA_ID, name: "Mina" },
  task: {
    id: TASK_ID,
    title: "Draw the shepherd and his sheep",
    lessonTitle: "The Good Shepherd",
    stage: "3rd Class",
    dueDate: "2026-11-08",
    done: false,
    completedAt: null,
    completedByYou: false,
    completedBy: null,
    instructions: "Draw the shepherd.\nCount the sheep together.",
    resources: [
      { label: "The story as a video", url: "https://example.org/story" },
      { label: "Sneaky link", url: "javascript:alert(1)" },
    ],
    ...task,
  },
  lesson: {
    title: "The Good Shepherd",
    teachingDate: "2026-11-08",
    passage: "John 10:1-18",
    memoryVerse: "I am the good shepherd.",
  },
  ...extra,
})

function open(
  data: ParentTaskDetail | (() => Response),
  { locale = "en", children }: { locale?: Locale; children?: ChildSummary[] } = {}
) {
  let reads = 0

  server.use(
    http.get(apiUrl(path), () => {
      reads++

      return typeof data === "function" ? data() : HttpResponse.json(data)
    })
  )

  const { client, wrapper } = testProviders({ locale })

  if (children) {
    client.setQueryData(parentChildrenQuery.queryKey, { today: "2026-11-08", items: children })
  }

  render(<ParentTaskPage />, { wrapper })

  return { reads: () => reads }
}

const markDone = () => screen.findByRole("button", { name: "Mark as done" })

test("shows the task with the lesson's passage and verse", async () => {
  open(detail())

  expect(
    await screen.findByRole("heading", { name: "Draw the shepherd and his sheep" })
  ).toBeInTheDocument()

  const stage = screen.getByText("3rd Class")
  expect(stage.tagName).toBe("BDI")
  expect(stage.parentElement).toHaveTextContent(/^For \u2068Mina\u2069 · 3rd Class$/)
  expect(screen.getByText("Due today")).toBeInTheDocument()
  expect(screen.getByText(/Count the sheep together/)).toHaveAttribute("dir", "auto")
  const lesson = within(screen.getByRole("region", { name: "From the lesson" }))
  expect(lesson.getByText("John 10:1-18")).toBeInTheDocument()
  expect(lesson.getByText("I am the good shepherd.")).toBeInTheDocument()
  const resources = within(screen.getByRole("region", { name: "Resources" }))

  expect(resources.getByRole("link", { name: "The story as a video" })).toHaveAttribute(
    "rel",
    "noreferrer"
  )

  expect(resources.queryByRole("link", { name: "Sneaky link" })).not.toBeInTheDocument()
  expect(resources.getByText("Sneaky link")).toBeInTheDocument()
})

test("the lesson box hides without passage and verse", async () => {
  open(
    detail(
      {},
      {
        lesson: {
          title: "The Good Shepherd",
          teachingDate: "2026-11-08",
          passage: null,
          memoryVerse: null,
        },
      }
    )
  )

  await markDone()
  expect(screen.queryByRole("region", { name: "From the lesson" })).not.toBeInTheDocument()
})

test("the back link names the child when the parent has several", async () => {
  open(detail(), { children: [mimi, mina] })

  expect(await screen.findByRole("link", { name: "Homework for ⁨Mina⁩" })).toHaveAttribute(
    "href",
    `/parent/homework/?child=${MINA_ID}`
  )
})

test("the back link reads Homework for an only child", async () => {
  open(detail(), { children: [mina] })
  expect(await screen.findByRole("link", { name: "Homework" })).toBeInTheDocument()
})

test("Mark as done shows the panel at once, then who reported it", async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))
  const puts: unknown[] = []
  open(detail())

  server.use(
    http.put(apiUrl(`${path}/completion`), async ({ request }) => {
      puts.push(await request.json())
      await gate

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

  await userEvent.dblClick(await markDone())
  expect(screen.getByRole("status")).toHaveTextContent("Saving…")
  release()
  expect(await screen.findByText("You reported it today at 12:08.")).toBeInTheDocument()
  expect(puts).toEqual([{}])
})

test("a 200 with the co-parent's report names them", async () => {
  open(detail())

  server.use(
    http.put(apiUrl(`${path}/completion`), () =>
      HttpResponse.json({
        done: true,
        completedAt: "2026-11-08T09:30:00Z",
        completedBy: "Nabil Hanna",
        completedByYou: false,
      })
    )
  )

  await userEvent.click(await markDone())
  expect(await screen.findByText("Nabil Hanna reported it today at 10:30.")).toBeInTheDocument()
})

test.each([
  ["a 404", () => problem(404, "homework.notAvailable"), "This homework is not available."],
  [
    "a network error",
    () => HttpResponse.error(),
    "No connection. Check your internet connection and try again.",
  ],
])("%s reverts and toasts", async (_, respond, message) => {
  open(detail())
  server.use(http.put(apiUrl(`${path}/completion`), respond))
  await userEvent.click(await markDone())
  await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith(message))
  expect(await markDone()).toBeEnabled()
  expect(screen.queryByRole("status")).not.toBeInTheDocument()
})

test("Undo sends one DELETE, brings Mark as done back and refetches", async () => {
  const deletes: unknown[] = []

  const page = open(
    detail({ done: true, completedAt: "2026-11-08T11:08:00Z", completedByYou: true })
  )

  server.use(
    http.delete(apiUrl(`${path}/completion`), async ({ request }) => {
      deletes.push(await request.json())

      return new HttpResponse(null, { status: 204 })
    })
  )

  expect(await screen.findByText("You reported it today at 12:08.")).toBeInTheDocument()
  await userEvent.dblClick(screen.getByRole("button", { name: "Undo" }))
  expect(await markDone()).toBeInTheDocument()
  await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("Marked as not done for Mina."))
  expect(deletes).toEqual([{}])
  await vi.waitFor(() => expect(page.reads()).toBe(2))
})

test.each([
  ["a 404", `id=${TASK_ID}&child=${MINA_ID}`],
  ["a missing child", `id=${TASK_ID}`],
  ["a malformed id", `id=nope&child=${MIMI_ID}`],
])("%s shows the same not-available page", async (_, query) => {
  address.set(query)
  open(() => problem(404, "homework.notAvailable"))
  expect(await screen.findByText("This page isn’t available")).toBeInTheDocument()
})

test("in Arabic the button spans the width on phones", async () => {
  open(detail(), { locale: "ar" })
  expect(await screen.findByRole("button", { name: "الإبلاغ عن الإنجاز" })).toHaveClass("w-full")
})
