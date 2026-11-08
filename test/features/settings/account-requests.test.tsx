import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Me } from "@/features/auth/api"
import { SessionProvider } from "@/features/auth/session"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { AccountRequest } from "@/features/settings/api"
import { SettingsPage } from "@/features/settings/settings-page"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const sundaySchool = { id: services.items[0].id, name: "Sunday School", tone: 1, archived: false }

const rows = () =>
  within(
    screen.getByRole("heading", { name: /^Account requests/ }).closest("section")!
  ).getAllByRole("listitem")

const request = (
  n: number,
  displayName: string,
  registeredAs: AccountRequest["registeredAs"],
  language: AccountRequest["account"]["language"],
  registeredAt: string,
  note: string | null
): AccountRequest => ({
  account: {
    id: `0192f3a4-7b1c-7d2e-8f70-00000000000${n}`,
    email: `${displayName.split(" ")[0].toLowerCase()}@example.org`,
    displayName,
    language,
  },
  registeredAt,
  registeredAs,
  note,
  services: registeredAs === "servant" ? [sundaySchool] : [],
})

const requests = [
  request(1, "Mariam Hanna", "parent", "en", "2026-11-08T12:08:00+01:00", "Youssef, 3rd Class"),
  request(2, "Mina Girgis", "servant", "ar", "2026-11-07T19:30:00+01:00", "3rd Class since 2024"),
  request(3, "Nadia Saad", "parent", "de", "2026-11-01T10:00:00+01:00", null),
]

function open(account: Me = me.administrator, decline?: () => Response) {
  let items = [...requests]
  const calls = { list: 0, decline: [] as unknown[] }

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(account)),
    http.get(apiUrl("/account-requests"), () => {
      calls.list++

      return HttpResponse.json({ items, today: "2026-11-08" })
    }),
    http.post(apiUrl("/account-requests/:id/decline"), async ({ request: req, params }) => {
      calls.decline.push(await req.json())
      const answer = decline?.() ?? new HttpResponse(null, { status: 204 })

      if (answer.status === 204) {
        items = items.filter((r) => r.account.id !== params.id)
      }

      return answer
    })
  )

  renderWithProviders(
    <SessionProvider>
      <SidebarProvider>
        <SettingsPage />
      </SidebarProvider>
    </SessionProvider>
  )

  return calls
}

test("three requests render the mockup's lines", async () => {
  open()
  expect(await screen.findByRole("heading", { name: "Account requests (3)" })).toBeInTheDocument()
  const all = rows()
  expect(all[0]).toHaveTextContent("mariam@example.org · registered today at 12:08 · English")
  expect(all[0]).toHaveTextContent("Parent")
  expect(all[1]).toHaveTextContent("Servant")
  expect(all[1]).toHaveTextContent("Sunday School")
  expect(within(all[1]).getByText("العربية")).toHaveAttribute("lang", "ar")
  expect(within(all[0]).getByText("Youssef, 3rd Class")).toHaveAttribute("dir", "auto")
})

test("Decline asks first, sends one POST with {}, and the row goes", async () => {
  const calls = open()
  await screen.findByRole("heading", { name: "Account requests (3)" })
  await userEvent.click(within(rows()[0]).getByRole("button", { name: "Decline" }))
  const dialog = within(screen.getByRole("alertdialog"))
  expect(dialog.getByText("Decline Mariam Hanna’s registration?")).toBeInTheDocument()
  await userEvent.click(dialog.getByRole("button", { name: "Decline and delete" }))
  await waitFor(() => expect(calls.decline).toEqual([{}]))
  expect(toast.success).toHaveBeenCalledWith("Declined. Mariam Hanna’s registration was deleted.")
  expect(await screen.findByRole("heading", { name: "Account requests (2)" })).toBeInTheDocument()
})

test("a 409 alreadyApproved toasts and refetches", async () => {
  const calls = open(me.administrator, () => problem(409, "accounts.alreadyApproved"))
  await screen.findByRole("heading", { name: "Account requests (3)" })
  await userEvent.click(within(rows()[0]).getByRole("button", { name: "Decline" }))

  await userEvent.click(
    within(screen.getByRole("alertdialog")).getByRole("button", { name: "Decline and delete" })
  )

  await waitFor(() => expect(toast.error).toHaveBeenCalled())
  await waitFor(() => expect(calls.list).toBe(2))
})

test("staff who may only read requests are not offered Decline", async () => {
  open(me.churchOffice)
  expect(await screen.findByText(requests[0].account.email)).toBeInTheDocument()
  expect(screen.queryByRole("button", { name: /Decline/ })).toBeNull()
})

test("an empty list says so", async () => {
  server.use(
    http.get(apiUrl("/account-requests"), () =>
      HttpResponse.json({ items: [], today: "2026-11-08" })
    )
  )

  open()

  server.use(
    http.get(apiUrl("/account-requests"), () =>
      HttpResponse.json({ items: [], today: "2026-11-08" })
    )
  )

  expect(await screen.findByText("No accounts are waiting for approval.")).toBeInTheDocument()
})

test.each([
  ["a servant", me.servant],
  ["a leader", me.leader],
])("%s sees NoAccess and the list is never requested", async (_, account) => {
  const calls = open(account)
  expect(await screen.findByText("Not allowed")).toBeInTheDocument()
  expect(calls.list).toBe(0)
})
