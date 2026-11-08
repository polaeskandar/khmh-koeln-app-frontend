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

import type { AccountRequest, MemberAccount } from "@/features/identity/settings/api"
import { SettingsPage } from "@/features/identity/settings/settings-page"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const mariam = { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f01", name: "Mariam Fahmy" }

const account = (id: string, name: string, extra: Partial<MemberAccount> = {}): MemberAccount => ({
  id,
  name,
  email: `${name.split(" ")[0]!.toLowerCase()}@example.org`,
  isParent: false,
  disabled: false,
  member: { id: `${id.slice(0, -1)}9`, name, inactive: false, groups: ["Bible Study"] },
  ageCheck: "sixteenOrOlder",
  guardianConsentNote: null,
  approvedAt: "2026-11-01T10:00:00Z",
  approvedBy: mariam,
  ...extra,
})

const hoda = account("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ed101", "Hoda Farag", { isParent: true })

const mina = account("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ed102", "Mina Hanna", {
  ageCheck: "guardianConsent",
  guardianConsentNote: "His mother agreed in person on 8 November.",
  member: {
    id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ed109",
    name: "Mina Hanna",
    inactive: false,
    groups: ["Youth Meeting", "Deacons’ School › Advanced"],
  },
})

const nevine = account("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ed103", "Nevine Boulos", {
  ageCheck: null,
  approvedBy: null,
})

const nevineRequest: AccountRequest = {
  account: { id: nevine.id, email: nevine.email, displayName: nevine.name, language: "en" },
  registeredAt: "2026-11-08T10:00:00Z",
  registeredAs: "member",
  note: null,
  services: [],
}

function open(
  who: Me = me.administrator,
  unlink: () => Response = () => new HttpResponse(null, { status: 204 })
) {
  let items = [hoda, mina, nevine]
  let requests: AccountRequest[] = []
  let reads = 0
  const posts: string[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(who)),
    http.get(apiUrl("/account-requests"), () =>
      HttpResponse.json({ items: requests, today: "2026-11-08" })
    ),
    http.get(apiUrl("/member-accounts"), () => {
      reads++

      return HttpResponse.json({ today: "2026-11-08", items })
    }),
    http.post(apiUrl("/member-accounts/:id/unlink"), async ({ params, request }) => {
      posts.push(`${params.id} ${JSON.stringify(await request.json())}`)
      const answer = unlink()

      if (answer.status === 204) {
        items = items.filter((item) => item.id !== params.id)
        requests = [nevineRequest]
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

  return { posts, reads: () => reads }
}

const section = async () =>
  within((await screen.findByRole("heading", { name: "Member accounts" })).closest("section")!)

test("lists the accounts in API order with their record and age check", async () => {
  open()
  const list = await section()
  const rows = await list.findAllByRole("listitem")

  expect(rows.map((row) => row.querySelector("bdi")?.textContent)).toEqual([
    "Hoda Farag",
    "Mina Hanna",
    "Nevine Boulos",
  ])

  expect(rows[0]).toHaveTextContent("Also a parent")

  expect(rows[1]).toHaveTextContent(
    "Under 16, a parent agreed: His mother agreed in person on 8 November."
  )

  expect(rows[1]).toHaveTextContent(
    "Record: Mina Hanna · Youth Meeting, Deacons’ School › Advanced"
  )

  expect(rows[2]).toHaveTextContent("Linked by the church office")
  expect(rows[0]).toHaveTextContent("approved on Sun 1 Nov at 11:00 by Mariam Fahmy")
})

test("removing Nevine's link posts once, toasts, and her request comes back", async () => {
  const { posts } = open()
  const list = await section()
  const nevineRow = (await list.findAllByRole("listitem"))[2]!
  await userEvent.click(within(nevineRow).getByRole("button", { name: "Remove link" }))
  const dialog = within(await screen.findByRole("alertdialog"))

  expect(
    dialog.getByText("Homework reports made with the account stay in the history.")
  ).toBeInTheDocument()

  expect(dialog.getByText(/goes back to the account requests/)).toBeInTheDocument()
  await userEvent.click(dialog.getByRole("button", { name: "Remove link" }))
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Link removed for Nevine Boulos."))
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
  expect(posts).toEqual([`${nevine.id} {}`])
  await waitFor(() => expect(list.queryByText("Nevine Boulos")).not.toBeInTheDocument())
  expect(await screen.findByText("Nevine Boulos")).toBeInTheDocument()
})

test("a link already removed toasts and refetches", async () => {
  const page = open(me.administrator, () => problem(409, "accounts.notLinked"))
  const list = await section()

  await userEvent.click(
    within((await list.findAllByRole("listitem"))[2]!).getByRole("button", { name: "Remove link" })
  )

  await userEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Remove link" })
  )

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("This account isn’t linked to a member record.")
  )

  await waitFor(() => expect(page.reads()).toBe(2))
})

test("leaders don't see the section", async () => {
  open(me.leader)
  await screen.findByRole("heading", { level: 1 })
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(screen.queryByRole("heading", { name: "Member accounts" })).not.toBeInTheDocument()
})
