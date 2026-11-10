import { useQuery } from "@tanstack/react-query"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { attendanceOverviewQuery } from "@/features/meetings/attendance/api"
import { upcomingQuery } from "@/features/meetings/dashboard/api"
import type { ServiceList } from "@/features/organization/services/api"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { schedule } from "@test/support/fixtures/schedules"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { SchedulesPage } from "@/features/meetings/meetings/schedules-page"

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
})

const sundaySchool = services.items[0]

const existing = schedule({
  service: { id: sundaySchool.id, name: "Sunday School", tone: 1, archived: false },
})

const reads = { upcoming: 0, overview: 0 }

function OtherLists() {
  useQuery(upcomingQuery)
  useQuery(attendanceOverviewQuery)

  return null
}

function open({
  list = services,
  write = () => HttpResponse.json({ id: "s-new", createdSessions: 1 }, { status: 201 }),
  schedules = [existing],
  who = me.leader,
}: {
  list?: ServiceList
  write?: () => Response | Promise<Response>
  schedules?: ReturnType<typeof schedule>[]
  who?: Me
} = {}) {
  const sent: { method: string; body: Record<string, unknown> }[] = []
  reads.upcoming = 0
  reads.overview = 0

  server.use(
    http.get(apiUrl("/dashboard/upcoming"), () => {
      reads.upcoming++

      return HttpResponse.json({
        today: "2026-11-08",
        from: "2026-11-09",
        to: "2026-11-15",
        items: [],
      })
    }),
    http.get(apiUrl("/attendance/overview"), () => {
      reads.overview++

      return HttpResponse.json({
        today: "2026-11-08",
        sessions: [],
        earlier: [],
        closed: [],
        openCount: 0,
      })
    }),
    http.get(apiUrl("/schedules"), () =>
      HttpResponse.json({ today: "2026-11-08", items: schedules })
    ),
    http.get(apiUrl("/services"), () => HttpResponse.json(list)),
    http.post(apiUrl("/schedules"), async ({ request }) => {
      sent.push({ method: "POST", body: (await request.json()) as Record<string, unknown> })

      return write()
    }),
    http.put(apiUrl(`/schedules/${existing.id}`), async ({ request }) => {
      sent.push({ method: "PUT", body: (await request.json()) as Record<string, unknown> })

      return HttpResponse.json({ id: existing.id, createdSessions: 0 })
    })
  )

  renderWithProviders(
    <>
      <SchedulesPage />
      <OtherLists />
    </>,
    { me: who, sidebar: true }
  )

  return sent
}

const newDialog = async () => {
  await userEvent.click(await screen.findByRole("button", { name: "New schedule" }))

  return within(await screen.findByRole("dialog"))
}

const preview = () => screen.getByTestId("schedule-preview")
const weekday = (name: string) => screen.getByRole("button", { name })

describe("the preview", () => {
  test("every Sunday from today lists 8 to 29 Nov and is created right away", async () => {
    open()
    await newDialog()

    await waitFor(() =>
      expect(preview()).toHaveTextContent("Next: Sun 8 Nov, Sun 15 Nov, Sun 22 Nov, Sun 29 Nov.")
    )

    expect(preview()).toHaveTextContent("The first session is created right away.")
  })

  test("every other Monday lists 16 and 30 Nov, 14 and 28 Dec, created on Sun 15 Nov", async () => {
    open()
    const dialog = await newDialog()

    await userEvent.selectOptions(
      dialog.getByRole("combobox", { name: "Every how many weeks" }),
      "2"
    )

    await userEvent.click(weekday("Sunday"))
    await userEvent.click(weekday("Monday"))

    await waitFor(() =>
      expect(preview()).toHaveTextContent("Next: Mon 16 Nov, Mon 30 Nov, Mon 14 Dec, Mon 28 Dec.")
    )

    expect(preview()).toHaveTextContent("The first session is created on Sun 15 Nov.")
  })

  test("no weekday or an end before the start blocks submit", async () => {
    open()
    const dialog = await newDialog()
    await userEvent.click(weekday("Sunday"))
    expect(preview()).toHaveTextContent("Choose at least one weekday.")
    expect(dialog.getByRole("button", { name: "Create schedule" })).toBeDisabled()
    await userEvent.click(weekday("Sunday"))
    await userEvent.type(dialog.getByLabelText("Last date (optional)"), "2026-11-01")
    expect(dialog.getByRole("button", { name: "Create schedule" })).toBeDisabled()
  })
})

describe("editing the pattern", () => {
  test("clearing the first date asks for one instead of failing", async () => {
    open()
    const dialog = await newDialog()
    await userEvent.clear(dialog.getByLabelText("First date"))
    expect(preview()).toHaveTextContent("Choose the first date.")
    expect(dialog.getByRole("button", { name: "Create schedule" })).toBeDisabled()
  })

  test("switching to monthly drops a weekly interval it cannot offer", async () => {
    open()
    const dialog = await newDialog()

    await userEvent.selectOptions(
      dialog.getByRole("combobox", { name: "Every how many weeks" }),
      "4"
    )

    await userEvent.click(dialog.getByRole("radio", { name: "Monthly" }))

    expect(dialog.getByRole("combobox", { name: "Every how many months" })).toHaveValue("1")
    expect(preview()).toHaveTextContent("Next: Sat 5 Dec, Sat 2 Jan, Sat 6 Feb, Sat 6 Mar.")
  })
})

describe("saving", () => {
  test("a weekly schedule sends monthWeek null and empty optionals as null, then toasts", async () => {
    const sent = open()
    const dialog = await newDialog()
    await userEvent.type(dialog.getByLabelText("Name"), "Sunday class")
    await userEvent.click(dialog.getByRole("button", { name: "Create schedule" }))
    await waitFor(() => expect(sent).toHaveLength(1))

    expect(sent[0].body).toEqual({
      roster: { serviceId: sundaySchool.id, stageId: null, mode: "expected" },
      details: { name: "Sunday class", description: null, location: null },
      recurrence: {
        frequency: "weekly",
        interval: 1,
        weekdays: [7],
        monthWeek: null,
        span: { startsOn: "2026-11-08", endsOn: null },
      },
      times: { startTime: "18:00", endTime: "19:30" },
    })

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Schedule created. 1 session was created for today and tomorrow."
      )
    )
  })

  test("the last Friday monthly sends weekdays [5] and monthWeek -1", async () => {
    const sent = open()
    const dialog = await newDialog()
    await userEvent.type(dialog.getByLabelText("Name"), "Family evening")
    await userEvent.click(dialog.getByRole("radio", { name: "Monthly" }))
    await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Week of the month" }), "-1")
    await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Weekday" }), "5")
    await userEvent.click(dialog.getByRole("button", { name: "Create schedule" }))
    await waitFor(() => expect(sent).toHaveLength(1))

    expect(sent[0].body.recurrence).toMatchObject({
      frequency: "monthly",
      weekdays: [5],
      monthWeek: -1,
    })
  })

  test("422s show on their controls and focus the first; a 409 keeps the dialog open", async () => {
    let answer = () =>
      problem(422, "checkFields", {
        fieldErrors: {
          "details.name": { code: "meetings.scheduleNameRequired", params: {} },
          "times.endTime": { code: "meetings.endAfterStart", params: {} },
          "recurrence.weekdays": { code: "recurrence.weekdays", params: {} },
        },
      })

    open({ write: () => answer() })
    const dialog = await newDialog()
    await userEvent.click(dialog.getByRole("button", { name: "Create schedule" }))
    const name = dialog.getByLabelText("Name")
    await waitFor(() => expect(name).toHaveFocus())
    expect(name).toHaveAttribute("aria-invalid", "true")
    expect(dialog.getByLabelText("Ends at (optional)")).toHaveAttribute("aria-invalid", "true")
    expect(dialog.getByText("Choose at least one weekday.")).toBeInTheDocument()

    answer = () =>
      problem(409, "meetings.serviceArchivedRestoreFirst", { params: { name: "Sunday School" } })

    await userEvent.click(dialog.getByRole("button", { name: "Create schedule" }))
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  test("editing sends the whole schedule as a PUT without its roster", async () => {
    const sent = open()
    await userEvent.click(await screen.findByRole("button", { name: "Edit schedule" }))
    const dialog = within(await screen.findByRole("dialog"))

    expect(
      dialog.getByText("You are changing the whole schedule", { exact: false })
    ).toBeInTheDocument()

    await userEvent.click(dialog.getByRole("button", { name: "Save schedule" }))
    await waitFor(() => expect(sent).toHaveLength(1))
    expect(sent[0].method).toBe("PUT")

    expect(sent[0].body).toEqual({
      details: { name: existing.name, description: null, location: existing.location },
      recurrence: existing.recurrence,
      times: { startTime: existing.startTime, endTime: existing.endTime },
      rosterMode: existing.rosterMode,
    })
  })
})

test("Escape doesn't close the schedule dialog while it saves", async () => {
  let answer: (response: Response) => void = () => {}
  open({ write: () => new Promise<Response>((resolve) => (answer = resolve)) })
  const dialog = await newDialog()
  await userEvent.type(dialog.getByLabelText("Name"), "Sunday class")
  await userEvent.click(dialog.getByRole("button", { name: "Create schedule" }))

  await waitFor(() =>
    expect(dialog.getByRole("button", { name: /Create schedule/ })).toBeDisabled()
  )

  await userEvent.keyboard("{Escape}")
  expect(screen.getByRole("dialog")).toBeInTheDocument()
  answer(HttpResponse.json({ id: "s-new", createdSessions: 1 }, { status: 201 }))
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
})

test("creating a schedule refetches the dashboard and the attendance overview", async () => {
  open()
  const dialog = await newDialog()
  await waitFor(() => expect(reads).toEqual({ upcoming: 1, overview: 1 }))
  await userEvent.type(dialog.getByLabelText("Name"), "Sunday class")
  await userEvent.click(dialog.getByRole("button", { name: "Create schedule" }))
  await waitFor(() => expect(reads).toEqual({ upcoming: 2, overview: 2 }))
})

test("a servant sees neither New schedule nor Edit", async () => {
  open({ who: me.servant })

  await screen.findByText(/Sunday class/)
  expect(screen.queryByRole("button", { name: "New schedule" })).toBeNull()
  expect(screen.queryByRole("button", { name: "Edit schedule" })).toBeNull()
})
