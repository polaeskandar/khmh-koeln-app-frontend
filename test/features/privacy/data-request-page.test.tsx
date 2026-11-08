import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Me } from "@/features/identity/api"
import { SessionProvider } from "@/features/identity/session"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { DataRequestDetail } from "@/features/privacy/api"
import { DataRequestPage } from "@/features/privacy/data-request-page"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

const ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea901"

beforeEach(() => {
  search.value = `id=${ID}`
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const review = (extra: Partial<DataRequestDetail> = {}): DataRequestDetail => ({
  today: "2026-11-08",
  request: {
    id: ID,
    kind: "erasure",
    channel: "email",
    status: "open",
    requestedBy: "The mother, Hoda Farag",
    receivedAt: "2026-11-02T10:00:00Z",
    dueOn: "2026-12-02",
    closedAt: null,
    closedBy: null,
    declineReason: null,
    subjectName: "Kirollos Iskander",
    erasedSubject: null,
    note: null,
    outcome: null,
  },
  member: {
    id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea111",
    firstName: "Kirollos",
    lastName: "Iskander",
    displayName: null,
    status: "active",
    memberships: [
      { service: "Sunday School", stage: "3rd Class", from: "2025-09-07", until: null },
    ],
  },
  account: null,
  can: { erase: true },
  inventory: {
    erase: {
      person: 1,
      memberships: 1,
      attendance: 34,
      completions: 5,
      guardianLinks: 1,
      account: 0,
      roles: 0,
    },
    keep: {
      sessionTotals: 8,
      recordedMarks: 0,
      reportedCompletions: 0,
      lessons: 0,
      homework: 0,
      sessionHistory: 0,
    },
    mentions: [
      {
        id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea121",
        where: "lessonNote",
        text: "Kirollos needs extra help with reading.",
        date: "2026-11-01",
        group: "3rd Class",
      },
    ],
  },
  ...extra,
})

const erased: DataRequestDetail = {
  ...review(),
  request: {
    ...review().request,
    status: "done",
    subjectName: null,
    erasedSubject: { kind: "member", group: "3rd Class" },
    closedAt: "2026-11-08T11:00:00Z",
    closedBy: { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f01", name: "Nadia Saad" },
    outcome: {
      person: 1,
      memberships: 1,
      attendance: 34,
      completions: 5,
      guardianLinks: 1,
      notes: 1,
    },
  },
  member: null,
  inventory: null,
}

function open(
  first: DataRequestDetail,
  { who = me.churchOffice, erase }: { who?: Me; erase?: () => Response } = {}
) {
  let current = first
  let reads = 0
  const bodies: unknown[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(who)),
    http.get(apiUrl(`/data-requests/${ID}`), () => {
      reads++

      return HttpResponse.json(current)
    }),
    http.post(apiUrl(`/data-requests/${ID}/erase`), async ({ request }) => {
      bodies.push(await request.json())
      const answer = erase?.()

      if (answer) {
        return answer
      }

      current = erased

      return HttpResponse.json(erased.request)
    })
  )

  renderWithProviders(
    <SessionProvider>
      <SidebarProvider>
        <DataRequestPage />
      </SidebarProvider>
    </SessionProvider>
  )

  return { bodies, reads: () => reads }
}

const section = async (name: string | RegExp) =>
  within((await screen.findByRole("heading", { name })).closest("section")!)

test("the review lists what goes, what stays, and the notes that may mention them", async () => {
  open(review())

  expect(
    await screen.findByRole("heading", { name: "Kirollos Iskander", level: 1 })
  ).toBeInTheDocument()

  const erases = await section("What erasing deletes")
  expect(erases.getByText("The member record")).toBeInTheDocument()
  expect(erases.getByText("34 attendance marks")).toBeInTheDocument()

  expect(
    (await section("What stays, without the name")).getByText("Attendance totals of 8 meetings")
  ).toBeInTheDocument()

  const mentions = await section("Notes that may mention them (1)")
  expect(mentions.getByText("Lesson notes · 3rd Class · Sun 1 Nov 2026")).toBeInTheDocument()

  expect(mentions.getByText("Kirollos needs extra help with reading.")).toHaveAttribute(
    "dir",
    "auto"
  )

  expect(screen.getByText("Who it is about")).toBeInTheDocument()
})

test("erasing empties the notes by default, then shows the outcome", async () => {
  const { bodies } = open(review())
  await userEvent.click(await screen.findByRole("button", { name: "Erase data…" }))
  const dialog = within(await screen.findByRole("alertdialog"))

  expect(
    dialog.getByRole("checkbox", { name: "Also empty the note that may mention them" })
  ).toHaveAttribute("aria-checked", "true")

  await userEvent.click(dialog.getByRole("button", { name: "Erase data" }))

  expect(
    await screen.findByRole("heading", { name: "Erased member of 3rd Class", level: 1 })
  ).toBeInTheDocument()

  expect(bodies).toEqual([{ clearNotes: true }])
  expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent(/Erased$/)
  expect(screen.getByText("1 note that mentioned them, emptied")).toBeInTheDocument()
  expect(screen.queryByText("Who it is about")).not.toBeInTheDocument()
})

test("unticking keeps the notes", async () => {
  const { bodies } = open(review())
  await userEvent.click(await screen.findByRole("button", { name: "Erase data…" }))
  const dialog = within(await screen.findByRole("alertdialog"))

  await userEvent.click(
    dialog.getByRole("checkbox", { name: "Also empty the note that may mention them" })
  )

  await userEvent.click(dialog.getByRole("button", { name: "Erase data" }))
  await waitFor(() => expect(bodies).toEqual([{ clearNotes: false }]))
})

test("without mentions there is no checkbox", async () => {
  const data = review()
  open({ ...data, inventory: { ...data.inventory!, mentions: [] } })
  await userEvent.click(await screen.findByRole("button", { name: "Erase data…" }))

  expect(
    within(await screen.findByRole("alertdialog")).queryByRole("checkbox")
  ).not.toBeInTheDocument()

  expect(screen.getByText("No notes mention their name.")).toBeInTheDocument()
})

test("one's own account can't be erased here", async () => {
  open(review({ can: { erase: false } }))
  expect(await screen.findByRole("button", { name: "Erase data…" })).toBeDisabled()
  expect(screen.getByText(/This request is about your own account/)).toBeInTheDocument()
})

test("a request closed meanwhile toasts and refetches", async () => {
  const page = open(review(), { erase: () => problem(409, "privacy.notOpen") })
  await userEvent.click(await screen.findByRole("button", { name: "Erase data…" }))

  await userEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Erase data" })
  )

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("This request has already been closed.")
  )

  await waitFor(() => expect(page.reads()).toBeGreaterThanOrEqual(2))
})

test.each([
  ["leaders", me.leader],
  ["servants", me.servant],
])("%s get NoAccess without a request", async (_, who) => {
  const page = open(review(), { who })
  expect(await screen.findByText("You can’t handle data protection requests")).toBeInTheDocument()
  expect(page.reads()).toBe(0)
})
