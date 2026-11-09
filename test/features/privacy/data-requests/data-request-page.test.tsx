import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { DataRequestDetail, ErasureReview } from "@/features/privacy/data-requests/api"
import { DataRequestPage } from "@/features/privacy/data-requests/data-request-page"

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
    erasesOn: null,
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
  copyLink: null,
  ...extra,
})

const lessonNote = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea121",
  where: "lessonNote",
  text: "Kirollos needs extra help with reading.",
  date: "2026-11-01",
  group: "3rd Class",
}

const erasure = (extra: Partial<ErasureReview> = {}): ErasureReview => ({
  erase: {
    person: 1,
    memberships: 1,
    attendance: 34,
    completions: 5,
    guardianLinks: 1,
    account: 0,
    roles: 0,
  },
  keep: { sessionTotals: 8, accountRows: 0 },
  mentions: [lessonNote],
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
}

function open(
  first: DataRequestDetail,
  {
    who = me.administrator,
    erase,
    review = () => HttpResponse.json(erasure()),
  }: { who?: Me; erase?: () => Response; review?: () => Response } = {}
) {
  let current = first
  let reads = 0
  let reviews = 0
  const bodies: unknown[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(who)),
    http.get(apiUrl(`/data-requests/${ID}`), () => {
      reads++

      return HttpResponse.json(current)
    }),
    http.get(apiUrl(`/data-requests/${ID}/erasure`), () => {
      reviews++

      return review()
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

  return { bodies, reads: () => reads, reviews: () => reviews }
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

test("a removal reason reads as a correction note", async () => {
  open(review(), {
    review: () =>
      HttpResponse.json(erasure({ mentions: [{ ...lessonNote, where: "removalReason" }] })),
  })

  const mentions = await section("Notes that may mention them (1)")
  expect(mentions.getByText("Correction note · 3rd Class · Sun 1 Nov 2026")).toBeInTheDocument()
})

test("without mentions there is no checkbox", async () => {
  open(review(), { review: () => HttpResponse.json(erasure({ mentions: [] })) })
  await userEvent.click(await screen.findByRole("button", { name: "Erase data…" }))

  expect(
    within(await screen.findByRole("alertdialog")).queryByRole("checkbox")
  ).not.toBeInTheDocument()

  expect(screen.getByText("No notes mention their name.")).toBeInTheDocument()
})

test("one's own account can't be erased here, and is not reviewed", async () => {
  const page = open(
    review({
      member: null,
      account: {
        id: me.administrator.account.id,
        name: me.administrator.account.displayName,
        email: me.administrator.account.email,
        roles: ["Administrator"],
      },
    })
  )

  expect(await screen.findByRole("button", { name: "Erase data…" })).toBeDisabled()
  expect(screen.getByText(/This request is about your own account/)).toBeInTheDocument()
  expect(screen.queryByRole("heading", { name: "What erasing deletes" })).toBeNull()
  expect(page.reviews()).toBe(0)
})

test("a subject that is gone can't be erased", async () => {
  const page = open(review({ member: null, account: null }))
  expect(await screen.findByRole("button", { name: "Erase data…" })).toBeDisabled()
  expect(screen.getByText("The data this request is about no longer exists.")).toBeInTheDocument()
  expect(page.reviews()).toBe(0)
})

test("a review the API refuses says why, and Erase stays disabled", async () => {
  open(review(), { review: () => problem(409, "roles.lastAdministrator") })

  expect(
    await screen.findByText(
      "At least one active account must be able to change roles. Give that permission to someone else first."
    )
  ).toBeInTheDocument()

  expect(screen.getByRole("button", { name: "Erase data…" })).toBeDisabled()
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
  ["the church office", me.churchOffice],
])("%s get NoAccess without a request", async (_, who) => {
  const page = open(review(), { who })
  expect(await screen.findByText("You can’t handle data protection requests")).toBeInTheDocument()
  expect(page.reads()).toBe(0)
})

test("a self-service erasure says when it is erased automatically, and Erase stays", async () => {
  open(review({ request: { ...review().request, channel: "app", erasesOn: "2026-11-22" } }))

  expect(
    await screen.findByText(
      "Erased automatically on Sunday 22 November 2026, unless the person cancels before then. You can also erase the data now."
    )
  ).toBeInTheDocument()

  await waitFor(() => expect(screen.getByRole("button", { name: "Erase data…" })).toBeEnabled())
})

test("an erasure done on its date reads as erased automatically, by nobody", async () => {
  open({
    ...erased,
    request: { ...erased.request, erasesOn: "2026-11-08", closedBy: null },
  })

  const outcome = await section("Outcome")
  expect(outcome.getByText(/^Erased automatically today at 12:00/)).toBeInTheDocument()
  expect(outcome.queryByText(/ by /)).not.toBeInTheDocument()
})

test("a withdrawn erasure reads Withdrawn and says the person kept the account", async () => {
  open(
    review({
      request: {
        ...review().request,
        status: "withdrawn",
        channel: "app",
        erasesOn: "2026-11-21",
        closedAt: "2026-11-07T10:00:00Z",
      },
    })
  )

  expect(await screen.findByText("Withdrawn")).toBeInTheDocument()

  expect(
    (await section("Outcome")).getByText(
      "Withdrawn yesterday at 11:00: the person canceled the erasure and kept their account."
    )
  ).toBeInTheDocument()

  expect(screen.queryByRole("button", { name: "Erase data…" })).not.toBeInTheDocument()
  expect(screen.queryByText(/Erased automatically/)).not.toBeInTheDocument()
})
