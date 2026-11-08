import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { AgendaItem, PlannedItem, ScheduleSummary } from "@/lib/api/types/meetings"
import { apiUrl, problem } from "@test/support/api"
import { schedule } from "@test/support/fixtures/schedules"
import { services } from "@test/support/fixtures/services"
import { session, stageRef, sundaySchool } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import { SchedulePage } from "@/features/meetings/schedule-page"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  router.push.mockClear()
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const stage = stageRef("3rd Class", 2)

const planned = (date: string, scheduleId: string): PlannedItem => ({
  kind: "planned",
  scheduleId,
  date,
  title: "Sunday class",
  service: sundaySchool,
  stage,
  startTime: "12:00",
  endTime: "13:00",
  startsAt: `${date}T12:00:00+01:00`,
  endsAt: `${date}T13:00:00+01:00`,
  location: "Hall 1",
  rosterMode: "expected",
  can: { manage: true },
})

const asItem = (s: ReturnType<typeof session>): AgendaItem => ({ ...s, kind: "session" })

function open(data: ScheduleSummary | (() => ScheduleSummary)) {
  const current = typeof data === "function" ? data : () => data
  const id = current().id
  search.value = `id=${id}`

  server.use(
    http.get(apiUrl(`/schedules/${id}`), () =>
      HttpResponse.json({ today: "2026-11-08", schedule: current() })
    ),
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.get(apiUrl("/agenda"), ({ request }) => {
      const url = new URL(request.url)
      const from = url.searchParams.get("from")!

      const items: AgendaItem[] =
        from >= "2026-11-08"
          ? [
              asItem(session({ date: "2026-11-08", status: "completed", title: "Sunday class" })),
              planned("2026-11-15", id),
              asItem(
                session({
                  date: "2026-11-22",
                  status: "canceled",
                  cancelReason: "Church trip",
                  title: "Sunday class",
                })
              ),
              planned("2026-11-29", id),
            ]
          : [
              asItem(session({ date: "2026-10-25", status: "completed", title: "Sunday class" })),
              asItem(session({ date: "2026-11-01", status: "completed", title: "Sunday class" })),
            ]

      return HttpResponse.json({ today: "2026-11-08", from, to: url.searchParams.get("to"), items })
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <SchedulePage />
    </SidebarProvider>
  )

  return id
}

const section = async (name: string) =>
  within((await screen.findByRole("heading", { name })).closest("section")!)

test("without can.manage there are no actions and no date menus", async () => {
  open(schedule({ can: { manage: false } }))
  await screen.findByRole("heading", { name: "Sunday class", level: 1 })
  await (await section("Next dates")).findAllByRole("listitem")
  expect(screen.queryByRole("button", { name: "Edit schedule" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "More actions" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: /^Change 3rd Class on/ })).not.toBeInTheDocument()
})

test("failed agenda requests say so with a retry instead of loading forever", async () => {
  open(schedule())
  server.use(http.get(apiUrl("/agenda"), () => problem(403, "forbidden")))
  const next = await section("Next dates")
  expect(await next.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  const past = await section("Past sessions")
  expect(await past.findByRole("button", { name: "Try again" })).toBeInTheDocument()
})

test("next dates skip completed sessions and keep a date canceled ahead", async () => {
  open(schedule())
  const next = await section("Next dates")
  const rows = await next.findAllByRole("listitem")
  expect(rows).toHaveLength(3)
  expect(rows[1]).toHaveTextContent("Church trip")
  expect(next.getAllByRole("button", { name: /^Change 3rd Class on/ })).toHaveLength(2)
  const past = await section("Past sessions")
  const earlier = await past.findAllByRole("listitem")
  expect(earlier).toHaveLength(3)
  expect(earlier[0]).toHaveTextContent("Today")
})

test("an inactive schedule on an archived service can't be activated", async () => {
  open(
    schedule({
      active: false,
      generating: false,
      service: { ...sundaySchool, archived: true },
    })
  )

  const activate = await screen.findByRole("button", { name: "Activate" })
  expect(activate).toBeDisabled()
  expect(screen.getByText("Sunday School is archived.")).toBeInTheDocument()

  expect(
    screen.getByText(
      /This schedule is inactive.*Sunday School is archived\. Restore it before activating the schedule\./
    )
  ).toBeInTheDocument()

  expect(
    await screen.findByText("Nothing is planned while the schedule is inactive.")
  ).toBeInTheDocument()
})

test("activating toasts the sessions it created", async () => {
  let active = false

  const id = open(() =>
    schedule({ id: "0192f3a4-7b1c-7d2e-8f3f-00000000a001", active, generating: active })
  )

  server.use(
    http.post(apiUrl(`/schedules/${id}/activate`), () => {
      active = true

      return HttpResponse.json({ id, createdSessions: 1 })
    })
  )

  await userEvent.click(await screen.findByRole("button", { name: "Activate" }))

  await vi.waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "Schedule activated. 1 session was created for today and tomorrow."
    )
  )

  await vi.waitFor(() =>
    expect(screen.queryByRole("button", { name: "Activate" })).not.toBeInTheDocument()
  )
})

test("deactivating confirms with the history it keeps", async () => {
  const id = open(schedule({ sessionCount: 10 }))
  const posts: unknown[] = []

  server.use(
    http.post(apiUrl(`/schedules/${id}/deactivate`), async ({ request }) => {
      posts.push(await request.json())

      return HttpResponse.json({ id })
    })
  )

  await userEvent.click(await screen.findByRole("button", { name: "More actions" }))
  await userEvent.click(await screen.findByRole("menuitem", { name: "Deactivate" }))
  const dialog = within(await screen.findByRole("alertdialog"))

  expect(
    dialog.getByText("The 10 past sessions and their attendance stay in the history.")
  ).toBeInTheDocument()

  await userEvent.click(dialog.getByRole("button", { name: "Deactivate" }))

  await vi.waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "Schedule deactivated. No new sessions will be created; existing ones stay."
    )
  )

  expect(posts).toEqual([{}])
})

test("delete is disabled while the schedule has sessions", async () => {
  open(schedule({ sessionCount: 3 }))
  await userEvent.click(await screen.findByRole("button", { name: "More actions" }))

  expect(
    await screen.findByRole("menuitem", { name: "Can’t delete: has sessions" })
  ).toHaveAttribute("aria-disabled", "true")
})

test("deleting a schedule without sessions returns to the list", async () => {
  const id = open(schedule({ sessionCount: 0 }))
  server.use(http.delete(apiUrl(`/schedules/${id}`), () => new HttpResponse(null, { status: 204 })))
  await userEvent.click(await screen.findByRole("button", { name: "More actions" }))
  await userEvent.click(await screen.findByRole("menuitem", { name: "Delete schedule" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.click(dialog.getByRole("button", { name: "Delete schedule" }))
  await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/meetings/schedules/"))
  expect(toast.success).toHaveBeenCalledWith("Schedule deleted.")
})

test("a schedule with lessons can't be deleted", async () => {
  const id = open(schedule({ sessionCount: 0 }))

  server.use(
    http.delete(apiUrl(`/schedules/${id}`), () =>
      problem(409, "meetings.scheduleHasLessons", { params: { count: 2 } })
    )
  )

  await userEvent.click(await screen.findByRole("button", { name: "More actions" }))
  await userEvent.click(await screen.findByRole("menuitem", { name: "Delete schedule" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.click(dialog.getByRole("button", { name: "Delete schedule" }))

  await vi.waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "2 lessons are linked to this schedule. Deactivate it instead: no new sessions are created and the history stays."
    )
  )

  expect(router.push).not.toHaveBeenCalled()
})
