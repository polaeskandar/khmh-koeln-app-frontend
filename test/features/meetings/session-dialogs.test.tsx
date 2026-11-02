import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"

import { apiUrl, problem } from "@test/support/api"
import { session } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { SessionPage } from "@/features/meetings/session-page"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
})

afterEach(() => vi.restoreAllMocks())

function open(
  view: Parameters<typeof session>[0] = {},
  answer?: (body: unknown) => Response | Promise<Response>
) {
  let current = session({ status: "scheduled", date: "2026-11-15", ...view })
  search.value = `id=${current.id}`
  const sent: unknown[] = []

  server.use(
    http.get(apiUrl(`/sessions/${current.id}`), () =>
      HttpResponse.json({ today: "2026-11-08", session: current, schedule: null, history: [] })
    ),
    http.post(apiUrl(`/sessions/${current.id}/cancel`), async ({ request }) => {
      const body = (await request.json()) as { reason: string | null }
      sent.push(body)
      const response = await (answer?.(body) ?? HttpResponse.json({ id: current.id }))

      if (response.ok) {
        current = { ...current, status: "canceled", cancelReason: body.reason }
      }

      return response
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <SessionPage />
    </SidebarProvider>
  )

  return sent
}

const openCancel = async () => {
  await userEvent.click(await screen.findByRole("button", { name: "Change this session" }))
  await userEvent.click(screen.getByRole("menuitem", { name: "Cancel this session" }))

  return within(screen.getByRole("alertdialog"))
}

test("cancel trims the reason, toasts and the page shows the canceled banner", async () => {
  const sent = open()
  const dialog = await openCancel()

  expect(dialog.getByRole("heading")).toHaveTextContent(
    "Cancel 3rd Class on Sunday 15 November 2026?"
  )

  await userEvent.type(dialog.getByRole("textbox"), "  Church trip to Hamburg ")
  await userEvent.click(dialog.getByRole("button", { name: "Cancel session" }))
  await waitFor(() => expect(sent).toEqual([{ reason: "Church trip to Hamburg" }]))

  expect(toast.success).toHaveBeenCalledWith(
    "Session canceled. The schedule and its other sessions are unchanged."
  )

  expect(await screen.findByRole("status")).toHaveTextContent(/Reason: .Church trip to Hamburg./)
  expect(screen.queryByRole("alertdialog")).toBeNull()
})

test("a blank reason is sent as null; the note stops at 200", async () => {
  const sent = open()
  const dialog = await openCancel()
  expect(dialog.getByRole("textbox")).toHaveAttribute("maxLength", "200")
  await userEvent.type(dialog.getByRole("textbox"), "   ")
  await userEvent.click(dialog.getByRole("button", { name: "Cancel session" }))
  await waitFor(() => expect(sent).toEqual([{ reason: null }]))
})

test("while pending the buttons are disabled; a 409 keeps the dialog open with its text", async () => {
  let release = () => {}

  open({}, async () => {
    await new Promise<void>((resolve) => (release = resolve))

    return problem(409, "meetings.onlyScheduledCanCancel")
  })

  const dialog = await openCancel()
  await userEvent.click(dialog.getByRole("button", { name: "Cancel session" }))

  await waitFor(() =>
    expect(dialog.getAllByRole("button").every((button) => button.hasAttribute("disabled"))).toBe(
      true
    )
  )

  release()
  expect(await dialog.findByRole("alert")).toHaveTextContent(/./)
  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
})

test("a reopened dialog is reset", async () => {
  open({}, () => problem(409, "meetings.onlyScheduledCanCancel"))
  let dialog = await openCancel()
  await userEvent.type(dialog.getByRole("textbox"), "Trip")
  await userEvent.click(dialog.getByRole("button", { name: "Cancel session" }))
  await dialog.findByRole("alert")
  await userEvent.click(dialog.getByRole("button", { name: "Keep the session" }))
  dialog = await openCancel()
  expect(dialog.getByRole("textbox")).toHaveValue("")
  expect(dialog.queryByRole("alert")).toBeNull()
})

test.each([
  ["a servant", { can: { manage: false, record: true, reopen: false } }],
  ["an active session", { status: "active" as const, date: "2026-11-08" }],
  ["a completed session", { status: "completed" as const, date: "2026-11-01" }],
  ["a canceled session", { status: "canceled" as const }],
])("no menu for %s", async (_, view) => {
  open(view)
  await screen.findByRole("heading", { level: 1 })
  expect(screen.queryByRole("button", { name: "Change this session" })).toBeNull()
})
