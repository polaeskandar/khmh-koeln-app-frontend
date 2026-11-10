import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import type { Schemas } from "@/lib/api/client"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { testProviders } from "@test/support/providers"

import type { StaffAccount } from "@/features/identity/accounts/api"
import { StaffAccounts } from "@/features/identity/accounts/staff-accounts"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const role = (n: number, name: string) => ({
  id: `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ee${String(n).padStart(3, "0")}`,
  name,
})

const administrator = role(1, "Administrator")
const servant = role(2, "Servant")
const office = role(3, "Church office")
const helper = role(4, "Attendance helper")
const roles = [administrator, servant, office, helper]

const account = (
  n: number,
  displayName: string,
  had: typeof roles,
  disabled = false
): StaffAccount => ({
  id: `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef${String(n).padStart(3, "0")}`,
  displayName,
  email: `${displayName.split(" ")[0]!.toLowerCase()}@example.org`,
  disabled,
  roles: had,
  assignments: [],
})

const mariam = account(1, "Mariam Fahmy", [administrator])
const rebecca = account(2, "Rebecca Girgis", [servant])
const sara = account(3, "Sara Wissa", [office])
const samuel = account(4, "Samuel Rizk", [servant], true)

function open({
  remove,
  link,
  who = me.administrator,
}: { remove?: () => Response; link?: () => Response; who?: Me } = {}) {
  let items = [mariam, rebecca, sara, samuel]
  const sent: string[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(who)),
    http.get(apiUrl("/staff-accounts"), () => HttpResponse.json({ today: "2026-11-08", items })),
    http.get(apiUrl("/roles"), () => HttpResponse.json({ items: roles })),
    http.post(apiUrl("/accounts/:id/roles"), async ({ params, request }) => {
      const body = (await request.json()) as Schemas["GiveAccountRoleRequest"]
      sent.push(`give ${params.id} ${body.roleId}`)
      const given = roles.find((r) => r.id === body.roleId)!

      items = items.map((item) =>
        item.id === params.id ? { ...item, roles: [...item.roles, given] } : item
      )

      return HttpResponse.json({ role: { id: given.id, name: given.name } }, { status: 201 })
    }),
    http.delete(apiUrl("/accounts/:id/roles/:roleId"), ({ params }) => {
      sent.push(`remove ${params.id} ${params.roleId}`)

      return remove?.() ?? new HttpResponse(null, { status: 204 })
    }),
    http.post(apiUrl("/accounts/:id/password-link"), async ({ params, request }) => {
      sent.push(`link ${params.id} ${JSON.stringify(await request.json())}`)

      return link?.() ?? HttpResponse.json({ expiresAt: "2026-11-09T11:00:00Z" }, { status: 201 })
    })
  )

  const { client, wrapper } = testProviders()

  render(
    <SessionProvider>
      <StaffAccounts />
    </SessionProvider>,
    { wrapper }
  )

  return { sent, client }
}

const rowOf = async (name: string) =>
  (await screen.findByText(name, { selector: "bdi.font-medium" })).closest("li")!

test("rows keep the API order, the disabled account last with its badge", async () => {
  open()

  const rows = await screen
    .findAllByRole("listitem")
    .then(() => screen.getAllByText(/@example\.org/).map((email) => email.closest("li")!))

  expect(rows.map((row) => row.querySelector("bdi")?.textContent)).toEqual([
    "Mariam Fahmy",
    "Rebecca Girgis",
    "Sara Wissa",
    "Samuel Rizk",
  ])

  expect(rows[3]).toHaveTextContent("Disabled")
  expect(await rowOf("Sara Wissa")).toHaveTextContent("Church office")
})

test("giving a role offers the ones not held, and sends it once", async () => {
  const { sent } = open()
  const rebeccaRow = within(await rowOf("Rebecca Girgis"))
  await userEvent.click(await rebeccaRow.findByRole("button", { name: "Role" }))
  const dialog = within(await screen.findByRole("dialog"))
  const select = dialog.getByRole("combobox", { name: "Role" })

  expect(
    within(select)
      .getAllByRole("option")
      .map((o) => o.textContent)
  ).toEqual(["Choose a role", "Administrator", "Church office", "Attendance helper"])

  expect(dialog.getByRole("button", { name: "Give role" })).toBeDisabled()
  await userEvent.selectOptions(select, helper.id)
  await userEvent.click(dialog.getByRole("button", { name: "Give role" }))
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Role given."))
  expect(sent).toEqual([`give ${rebecca.id} ${helper.id}`])

  expect(
    await within(await rowOf("Rebecca Girgis")).findByText("Attendance helper")
  ).toBeInTheDocument()
})

test("Cancel closes the role dialog without giving a role", async () => {
  const { sent } = open()

  await userEvent.click(
    await within(await rowOf("Rebecca Girgis")).findByRole("button", { name: "Role" })
  )

  const dialog = within(await screen.findByRole("dialog"))
  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Role" }), helper.id)
  await userEvent.click(dialog.getByRole("button", { name: "Cancel" }))
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  expect(sent).toEqual([])
})

test("removing asks first; the last role manager keeps the role", async () => {
  const { sent } = open({ remove: () => problem(409, "roles.lastAdministrator") })
  const row = within(await rowOf("Mariam Fahmy"))

  await userEvent.click(
    await row.findByRole("button", { name: "Remove role Administrator from Mariam Fahmy" })
  )

  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.click(dialog.getByRole("button", { name: "Remove role" }))

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "At least one active account must be able to change roles. Give that permission to someone else first."
    )
  )

  expect(sent).toEqual([`remove ${mariam.id} ${administrator.id}`])
  expect(row.getByText("Administrator")).toBeInTheDocument()
})

test("a password link is emailed to the account and never shown", async () => {
  const { sent } = open()
  const row = within(await rowOf("Sara Wissa"))
  await userEvent.click(await row.findByRole("button", { name: "Password link…" }))
  const dialog = within(await screen.findByRole("dialog"))
  expect(await dialog.findByText(/^Sent to sara@example\.org\. Works until /)).toBeInTheDocument()
  expect(dialog.queryByRole("textbox")).not.toBeInTheDocument()
  expect(sent).toEqual([`link ${sara.id} {}`])
  await userEvent.click(dialog.getByRole("button", { name: "Close" }))
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
})

test("a disabled account's link refusal shows its text", async () => {
  open({ link: () => problem(409, "auth.disabled") })
  const row = within(await rowOf("Rebecca Girgis"))
  await userEvent.click(await row.findByRole("button", { name: "Password link…" }))

  expect(await within(await screen.findByRole("dialog")).findByRole("alert")).toHaveTextContent(
    "This account can no longer sign in."
  )
})

test("a disabled account can't get a link", async () => {
  open()

  expect(
    await within(await rowOf("Samuel Rizk")).findByRole("button", { name: "Password link…" })
  ).toBeDisabled()
})

test("with users: read only there is nothing to change, and the description says so", async () => {
  open({ who: me.churchOffice })
  const row = within(await rowOf("Sara Wissa"))
  expect(row.getByText("Church office")).toBeInTheDocument()

  expect(
    screen.getByText("Who has which role. Your roles let you see this, not change it.")
  ).toBeInTheDocument()

  expect(screen.queryByRole("button", { name: "Role" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: /^Remove role/ })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Password link…" })).not.toBeInTheDocument()
})

test("users: update without roles: update sends links but changes no roles", async () => {
  open({
    who: {
      ...me.administrator,
      permissions: me.administrator.permissions.filter(
        (p) => p.resource !== "roles" || p.action !== "update"
      ),
    },
  })

  const row = within(await rowOf("Sara Wissa"))
  expect(row.getByRole("button", { name: "Password link…" })).toBeEnabled()
  expect(screen.queryByRole("button", { name: "Role" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: /^Remove role/ })).not.toBeInTheDocument()
})

test("roles: update without users: update changes roles but sends no links", async () => {
  open({
    who: {
      ...me.administrator,
      permissions: me.administrator.permissions.filter(
        (p) => p.resource !== "users" || p.action !== "update"
      ),
    },
  })

  await rowOf("Sara Wissa")
  expect(await screen.findAllByRole("button", { name: "Role" })).not.toHaveLength(0)
  expect(screen.queryByRole("button", { name: "Password link…" })).not.toBeInTheDocument()
})

test("Sara's dialog gives Attendance helper once and shows the chip", async () => {
  const { sent } = open()

  await userEvent.click(
    await within(await rowOf("Sara Wissa")).findByRole("button", { name: "Role" })
  )

  const dialog = within(await screen.findByRole("dialog"))
  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Role" }), helper.id)
  await userEvent.dblClick(dialog.getByRole("button", { name: "Give role" }))

  expect(
    await within(await rowOf("Sara Wissa")).findByText("Attendance helper")
  ).toBeInTheDocument()

  expect(sent).toEqual([`give ${sara.id} ${helper.id}`])
})

test("Escape doesn't close the role dialog while the role is being given", async () => {
  open()
  server.use(http.post(apiUrl("/accounts/:id/roles"), () => new Promise<Response>(() => {})))

  await userEvent.click(
    await within(await rowOf("Rebecca Girgis")).findByRole("button", { name: "Role" })
  )

  const dialog = within(await screen.findByRole("dialog"))
  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Role" }), helper.id)
  await userEvent.click(dialog.getByRole("button", { name: "Give role" }))
  await waitFor(() => expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled())
  await userEvent.keyboard("{Escape}")
  expect(screen.getByRole("dialog")).toBeInTheDocument()
})
