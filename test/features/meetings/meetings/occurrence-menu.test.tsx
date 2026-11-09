import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { AgendaItem, PlannedItem } from "@/lib/api/types/meetings"
import { apiUrl, problem } from "@test/support/api"
import { services } from "@test/support/fixtures/services"
import { session } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { Agenda } from "@/features/meetings/meetings/api"
import { AgendaPage } from "@/features/meetings/meetings/agenda-page"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
})

afterEach(() => vi.restoreAllMocks())

const bibleStudy = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f17",
  name: "Bible Study",
  tone: 7,
  archived: false,
}

const youth = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f11",
  name: "Youth Meeting",
  tone: 2,
  archived: false,
}

const planned = (
  service: typeof youth,
  date: string,
  scheduleId: string,
  manage = true
): PlannedItem => ({
  kind: "planned",
  scheduleId,
  date,
  title: service.name,
  service,
  stage: null,
  startTime: "19:30",
  endTime: "21:00",
  startsAt: `${date}T19:30:00+01:00`,
  endsAt: `${date}T21:00:00+01:00`,
  location: null,
  rosterMode: "open",
  can: { manage },
})

const bibleWednesday = planned(bibleStudy, "2026-11-11", "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8a01")

function open(date: string, items: AgendaItem[], answer?: () => Response) {
  search.value = `date=${date}`
  let current = items
  const sent: { path: string; body: unknown }[] = []

  server.use(
    http.get(apiUrl("/agenda"), () =>
      HttpResponse.json({
        today: "2026-11-06",
        from: "2026-10-31",
        to: "2026-11-13",
        items: current,
      } satisfies Agenda)
    ),
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.post(
      apiUrl("/schedules/:schedule/occurrences/:date/cancel"),
      async ({ request, params }) => {
        const body = (await request.json()) as { reason: string | null }
        sent.push({ path: `${params.schedule}/${params.date}`, body })
        const response = answer?.() ?? HttpResponse.json({ sessionId: "s-new" })

        if (response.ok) {
          current = current.map((item) =>
            item.kind === "planned" && item.date === params.date
              ? {
                  ...session({
                    status: "canceled",
                    date: item.date,
                    service: item.service,
                    stage: null,
                    cancelReason: body.reason,
                  }),
                  kind: "session" as const,
                }
              : item
          )
        }

        return response
      }
    )
  )

  renderWithProviders(
    <SidebarProvider>
      <AgendaPage />
    </SidebarProvider>
  )

  return sent
}

const cancelDialog = async (name: string) => {
  await userEvent.click(await screen.findByRole("button", { name }))
  await userEvent.click(screen.getByRole("menuitem", { name: "Cancel this date" }))

  return within(screen.getByRole("alertdialog"))
}

test("cancelling Bible Study's Wed 11 Nov posts the trimmed reason; the row turns canceled", async () => {
  const sent = open("2026-11-11", [bibleWednesday])
  const dialog = await cancelDialog("Change Bible Study on Wednesday 11 November")

  expect(dialog.getByRole("heading")).toHaveTextContent(
    "Cancel Bible Study on Wednesday 11 November 2026?"
  )

  await userEvent.type(dialog.getByRole("textbox"), "  Retreat  ")
  await userEvent.click(dialog.getByRole("button", { name: "Cancel this date" }))

  await waitFor(() =>
    expect(sent).toEqual([
      { path: `${bibleWednesday.scheduleId}/2026-11-11`, body: { reason: "Retreat" } },
    ])
  )

  expect(toast.success).toHaveBeenCalledWith(
    "That date is canceled. The schedule and its other dates are unchanged."
  )

  const day = within(
    (await screen.findByRole("heading", { name: "Wednesday 11 November 2026" })).closest("section")!
  )

  expect(await day.findByText(/Retreat/)).toBeInTheDocument()
})

test("a blank reason is sent as null", async () => {
  const sent = open("2026-11-11", [bibleWednesday])
  const dialog = await cancelDialog("Change Bible Study on Wednesday 11 November")
  await userEvent.click(dialog.getByRole("button", { name: "Cancel this date" }))
  await waitFor(() => expect(sent[0]?.body).toEqual({ reason: null }))
})

test("a 409 dateInPast keeps the dialog open with its text and no toast", async () => {
  open("2026-11-11", [bibleWednesday], () => problem(409, "meetings.dateInPast"))
  const dialog = await cancelDialog("Change Bible Study on Wednesday 11 November")
  await userEvent.click(dialog.getByRole("button", { name: "Cancel this date" }))
  expect(await dialog.findByRole("alert")).toHaveTextContent("Choose today or a later date.")
  expect(toast.success).not.toHaveBeenCalled()
  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
})

test("only planned rows with can.manage get the menu, named for their own date", async () => {
  const youthFriday = planned(youth, "2026-11-13", "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8a02")
  const readOnly = planned(bibleStudy, "2026-11-13", "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8a03", false)

  const generated = {
    ...session({ date: "2026-11-13", service: youth, stage: null }),
    kind: "session" as const,
  }

  open("2026-11-13", [youthFriday, readOnly, generated])

  expect(
    await screen.findByRole("button", { name: "Change Youth Meeting on Friday 13 November" })
  ).toBeInTheDocument()

  expect(screen.getAllByRole("button", { name: /^Change / })).toHaveLength(1)
})
