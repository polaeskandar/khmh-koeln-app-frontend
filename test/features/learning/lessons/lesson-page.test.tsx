import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Me } from "@/features/identity/auth/api"
import { apiUrl, problem } from "@test/support/api"
import { stageHomework } from "@test/support/fixtures/homework"
import { goodSamaritan, lessonDetail, lessonStage } from "@test/support/fixtures/lessons"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { address } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { LessonDetail } from "@/features/learning/lessons/api"
import { LessonPage } from "@/features/learning/lessons/lesson-page"

beforeEach(() => {
  address.set(`id=${goodSamaritan.id}`)
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

const ready = (overrides: Partial<LessonDetail["lesson"]> = {}) =>
  lessonDetail(
    {
      status: "ready",
      teachingPoints:
        "1. The question\n2) Draw a road\n3. Who is my neighbour\n4. Go and do likewise",
      activities: "- Act out the story\n* Bandage a doll\n• Sing",
      materials: [{ label: "Map of Judea", url: "https://example.org/map" }],
      ...overrides,
    },
    { homework: { total: 3, published: 2, drafts: 1 } }
  )

function open(detail: LessonDetail, status?: () => Response, account: Me = me.servant) {
  const sent: unknown[] = []

  server.use(
    http.get(apiUrl(`/lessons/${goodSamaritan.id}`), () => HttpResponse.json(detail)),
    http.get(apiUrl(`/stages/${lessonStage.id}/homework`), () =>
      HttpResponse.json(stageHomework())
    ),
    http.post(apiUrl(`/lessons/${goodSamaritan.id}/status`), async ({ request }) => {
      const body = (await request.json()) as { status: string }
      sent.push(body)

      return (
        status?.() ??
        HttpResponse.json({
          id: goodSamaritan.id,
          status: body.status,
          completedAt: null,
          version: 2,
        })
      )
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <LessonPage />
    </SidebarProvider>,
    { me: account }
  )

  return sent
}

const panel = (name: string) => within(screen.getByRole("heading", { name }).closest("section")!)

test("the teaching plan lists points and activities without their prefixes", async () => {
  open(ready())
  await screen.findByRole("heading", { level: 1, name: "The Good Samaritan" })
  const plan = panel("Teaching plan")
  const [points, activities] = plan.getAllByRole("list")

  expect(
    within(points)
      .getAllByRole("listitem")
      .map((item) => item.textContent)
  ).toEqual(["The question", "Draw a road", "Who is my neighbour", "Go and do likewise"])

  expect(
    within(activities)
      .getAllByRole("listitem")
      .map((item) => item.textContent)
  ).toEqual(["Act out the story", "Bandage a doll", "Sing"])

  expect(plan.getByRole("link", { name: "Map of Judea" })).toHaveAttribute("rel", "noreferrer")
  expect(plan.getByText("Servants only")).toBeInTheDocument()

  expect(
    panel("Shared with parents and members").getByText("Parents and members see this")
  ).toBeInTheDocument()

  expect(screen.getByText(/\(2 now\)/)).toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Mark as taught" })).toBeNull()
})

test("empty objectives read their text and null notes are hidden", async () => {
  open(ready({ objectives: null, notes: null }))
  expect(await screen.findByText("No objectives yet.")).toBeInTheDocument()
  expect(screen.queryByRole("heading", { name: "Preparation notes" })).toBeNull()
})

describe("status actions", () => {
  test("a draft offers Edit and Mark ready", async () => {
    open(ready({ status: "draft" }))

    expect(await screen.findByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      `/lessons/edit/?id=${goodSamaritan.id}`
    )

    expect(screen.getByRole("button", { name: "Mark ready" })).toBeInTheDocument()
  })

  test("a ready lesson taught today or earlier is marked taught", async () => {
    const sent = open(ready({ teachingDate: "2026-11-08" }))
    await userEvent.click(await screen.findByRole("button", { name: "Mark as taught" }))
    await waitFor(() => expect(sent).toEqual([{ status: "completed" }]))
    expect(toast.success).toHaveBeenCalledWith("Marked as taught.")
  })

  test("a completed lesson offers Not taught yet", async () => {
    const sent = open(ready({ status: "completed" }))
    await userEvent.click(await screen.findByRole("button", { name: "More actions" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Not taught yet" }))
    await waitFor(() => expect(sent).toEqual([{ status: "ready" }]))
  })

  test("without lessons: update there are no actions", async () => {
    open(ready(), undefined, me.churchOffice)
    await screen.findByRole("heading", { level: 1 })
    expect(screen.queryByRole("link", { name: "Edit" })).toBeNull()
    expect(screen.queryByRole("button", { name: /Mark/ })).toBeNull()
    expect(screen.queryByRole("link", { name: "Add homework" })).toBeNull()
  })

  test("an archived stage offers no actions", async () => {
    open({ ...ready({ teachingDate: "2026-11-08" }), archived: true })
    await screen.findByRole("heading", { level: 1 })
    expect(screen.queryByRole("link", { name: "Edit" })).toBeNull()
    expect(screen.queryByRole("button", { name: /Mark/ })).toBeNull()
    expect(screen.queryByRole("link", { name: "Add homework" })).toBeNull()
  })

  test("Add homework opens the editor for this lesson", async () => {
    open(ready())

    expect(await screen.findByRole("link", { name: "Add homework" })).toHaveAttribute(
      "href",
      `/homework/new/?stage=${lessonStage.id}&lesson=${goodSamaritan.id}`
    )
  })

  test("a 409 taughtAfterDate toasts its text", async () => {
    open(ready({ teachingDate: "2026-11-08" }), () => problem(409, "lessons.taughtAfterDate"))

    await userEvent.click(await screen.findByRole("button", { name: "Mark as taught" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})
