import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { expect, test } from "vitest"

import { SessionProvider } from "@/features/identity/auth/session"
import type { Schemas } from "@/lib/api/client"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"
import { expectToast } from "@test/support/toasts"

import type { AccountRequest } from "@/features/identity/accounts/api"
import type { DirectoryEntry } from "@/features/people/members/api"
import type { RoleRow } from "@/features/identity/roles/api"
import { SettingsPage } from "@/features/identity/accounts/settings-page"

const sandra: AccountRequest = {
  account: {
    id: "0192f3a4-7b1c-7d2e-8f70-000000000001",
    email: "sandra@example.org",
    displayName: "Sandra Samuel",
    language: "de",
  },
  registeredAt: "2026-11-07T19:30:00+01:00",
  registeredAs: "parent",
  note: "Demiana and Mina",
  services: [],
}

const fady: AccountRequest = {
  ...sandra,
  account: {
    ...sandra.account,
    id: "0192f3a4-7b1c-7d2e-8f70-000000000002",
    displayName: "Fady Gerges",
  },
  registeredAs: "servant",
}

const parentRole: RoleRow = {
  id: "role-parent",
  name: "Parent",
  scope: "church",
  permissions: [{ action: "read", resource: "parentPortal" }],
  holderCount: 0,
}

const servantRole: RoleRow = {
  id: "role-servant",
  name: "Servant",
  scope: "assignedGroups",
  permissions: [{ action: "create", resource: "attendance" }],
  holderCount: 0,
}

const child = (n: number, firstName: string, lastName: string): DirectoryEntry => ({
  id: `0192f3a4-7b1c-7d2e-8f71-00000000000${n}`,
  firstName,
  lastName,
  displayName: null,
  groups: [
    {
      service: { id: "s", name: "Sunday School", tone: 1, archived: false },
      stage: { id: "st", name: "3rd Class", position: 2, archived: false },
    },
  ],
})

const demiana = child(1, "Demiana", "Fanous")
const mina = child(2, "Mina", "Hanna")

function open(approve?: () => Response, account = me.administrator) {
  const queries: string[] = []
  const sent: unknown[] = []
  const reads = { roles: 0, staffAccounts: 0, memberAccounts: 0, guardianLinks: 0 }

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(account)),
    http.get(apiUrl("/staff-accounts"), () => {
      reads.staffAccounts++

      return HttpResponse.json({ today: "2026-11-08", items: [] })
    }),
    http.get(apiUrl("/member-accounts"), () => {
      reads.memberAccounts++

      return HttpResponse.json({ today: "2026-11-08", items: [] })
    }),
    http.get(apiUrl("/guardian-links"), () => {
      reads.guardianLinks++

      return HttpResponse.json({ today: "2026-11-08", items: [], accounts: [] })
    }),
    http.get(apiUrl("/account-requests"), () =>
      HttpResponse.json({
        items: [sandra, fady],
        roles: [servantRole, parentRole].map(({ id, name }) => ({ id, name })),
        today: "2026-11-08",
      } satisfies Schemas["AccountRequestListResponse"])
    ),
    http.get(apiUrl("/roles"), () => {
      reads.roles++

      return HttpResponse.json({ items: [servantRole, parentRole] })
    }),
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.get(apiUrl("/people/directory"), ({ request }) => {
      const q = new URL(request.url).searchParams.get("q") ?? ""
      queries.push(q)

      return HttpResponse.json({
        items: q.startsWith("demi") ? [demiana] : q.startsWith("mina") ? [mina] : [],
      })
    }),
    http.post(apiUrl("/account-requests/:id/approve"), async ({ request }) => {
      sent.push(await request.json())

      return approve?.() ?? HttpResponse.json(sandra.account)
    })
  )

  renderWithProviders(
    <SessionProvider>
      <SettingsPage />
    </SessionProvider>,
    { sidebar: true }
  )

  return { queries, sent, reads }
}

const openApprove = async (row = 0) => {
  await userEvent.click((await screen.findAllByRole("button", { name: "Approve…" }))[row])

  return within(await screen.findByRole("dialog"))
}

test("parents and servants both get Approve…", async () => {
  open()
  await screen.findByRole("heading", { name: "Account requests (2)" })
  expect(screen.getAllByRole("button", { name: "Approve…" })).toHaveLength(2)
})

test("children are found from two letters and kept across searches; both are sent with the Parent role", async () => {
  const { queries, sent } = open()
  const dialog = await openApprove()
  expect(dialog.getByText("Demiana and Mina")).toHaveAttribute("dir", "auto")
  const submit = dialog.getByRole("button", { name: "Approve account" })
  expect(submit).toBeDisabled()
  const search = dialog.getByRole("textbox")
  await userEvent.type(search, "d")
  await new Promise((resolve) => setTimeout(resolve, 400))
  expect(queries).toEqual([])
  await userEvent.type(search, "emi")
  await userEvent.click(await dialog.findByRole("button", { name: /Demiana Fanous/ }))
  await userEvent.clear(search)
  await userEvent.type(search, "mina")
  await userEvent.click(await dialog.findByRole("button", { name: /Mina Hanna/ }))
  expect(dialog.getByText("2 children chosen")).toBeInTheDocument()
  expect(queries).toEqual(["demi", "mina"])
  await userEvent.click(submit)

  await waitFor(() =>
    expect(sent).toEqual([
      { as: "parent", childIds: [demiana.id, mina.id], roleIds: [parentRole.id] },
    ])
  )

  await expectToast("Sandra Samuel can sign in now.")
})

test("a chosen child is taken off with its named remove button", async () => {
  open()
  const dialog = await openApprove()
  await userEvent.type(dialog.getByRole("textbox"), "demi")
  await userEvent.click(await dialog.findByRole("button", { name: /Demiana Fanous/ }))
  expect(dialog.getByText("1 child chosen")).toBeInTheDocument()
  await userEvent.click(dialog.getByRole("button", { name: "Remove Demiana Fanous" }))
  expect(dialog.getByText("No child chosen yet")).toBeInTheDocument()
})

test("Enter in the child search approves nothing; only the button does", async () => {
  const { sent } = open()
  const dialog = await openApprove()
  const search = dialog.getByRole("textbox")
  await userEvent.type(search, "demi")
  await userEvent.click(await dialog.findByRole("button", { name: /Demiana Fanous/ }))
  await userEvent.type(search, "{Enter}")
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(sent).toEqual([])

  await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))
  await waitFor(() => expect(sent).toHaveLength(1))
})

test("roles that fail to load say so and can be retried", async () => {
  open()
  let rolesFail = true

  server.use(
    http.get(apiUrl("/roles"), () =>
      rolesFail
        ? problem(403, "forbidden")
        : HttpResponse.json({ items: [servantRole, parentRole] })
    )
  )

  const dialog = await openApprove()
  rolesFail = false
  await userEvent.click(await dialog.findByRole("button", { name: "Try again" }))
  await waitFor(() => expect(dialog.queryByRole("button", { name: "Try again" })).toBeNull())
})

test("a 422 childNotFound shows in the open dialog", async () => {
  open(() =>
    problem(422, "checkFields", {
      fieldErrors: { childIds: { code: "accounts.childNotFound", params: {} } },
    })
  )

  const dialog = await openApprove()
  await userEvent.type(dialog.getByRole("textbox"), "demi")
  await userEvent.click(await dialog.findByRole("button", { name: /Demiana Fanous/ }))
  await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))

  expect(
    await dialog.findByText(/./, { selector: "[data-slot='field-error']" })
  ).toBeInTheDocument()

  expect(screen.getByRole("dialog")).toBeInTheDocument()
})

test("a 409 closes the dialog and refetches", async () => {
  open(() => problem(409, "accounts.alreadyApproved"))
  const dialog = await openApprove()
  await userEvent.type(dialog.getByRole("textbox"), "demi")
  await userEvent.click(await dialog.findByRole("button", { name: /Demiana Fanous/ }))
  await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  await expectToast("This account has already been approved.")
})

test("approving a parent refetches the staff accounts, the roles and the parent links", async () => {
  const { reads } = open()
  const dialog = await openApprove()
  await userEvent.type(dialog.getByRole("textbox"), "demi")
  await userEvent.click(await dialog.findByRole("button", { name: /Demiana Fanous/ }))
  await waitFor(() => expect(reads).toMatchObject({ roles: 1, staffAccounts: 1, guardianLinks: 1 }))
  await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  await waitFor(() => expect(reads).toMatchObject({ roles: 2, staffAccounts: 2, guardianLinks: 2 }))
})

test("a parent starts with the Parent role ticked", async () => {
  open()
  const dialog = await openApprove()
  expect(await dialog.findByRole("checkbox", { name: /Parent/ })).toBeChecked()
  expect(dialog.getByRole("checkbox", { name: /Servant/ })).not.toBeChecked()
})

const sundaySchool = services.items[0]!
const thirdClass = sundaySchool.stages[2]!
const youth = services.items[1]!

const servantNamed = (named: (typeof services.items)[number][]) =>
  server.use(
    http.get(apiUrl("/account-requests"), () =>
      HttpResponse.json({
        items: [
          {
            ...fady,
            services: named.map(({ id, name, tone, archived }) => ({ id, name, tone, archived })),
          },
        ],
        today: "2026-11-08",
      })
    )
  )

test("a servant says where they serve, starts with nothing ticked and sends the ticked role once", async () => {
  const { sent } = open()
  servantNamed([youth])
  const dialog = await openApprove()
  expect(dialog.getByText("Says they serve in Youth Meeting.")).toBeInTheDocument()
  const submit = dialog.getByRole("button", { name: "Approve account" })
  expect(submit).toBeDisabled()
  await userEvent.click(await dialog.findByRole("checkbox", { name: /Servant/ }))
  await dialog.findByRole("button", { name: "Remove Youth Meeting" })
  await userEvent.dblClick(submit)

  await waitFor(() =>
    expect(sent).toEqual([
      {
        as: "servant",
        roleIds: [servantRole.id],
        assignments: [{ serviceId: youth.id, stageId: null }],
      },
    ])
  )
})

test("the groups start with the named service and send a chosen stage too", async () => {
  const { sent } = open()
  servantNamed([youth])
  const dialog = await openApprove()
  const groups = within(await dialog.findByRole("group", { name: "Groups" }))
  expect(await groups.findByText("Youth Meeting", { selector: "bdi" })).toBeInTheDocument()
  await userEvent.selectOptions(groups.getByRole("combobox", { name: "Service" }), sundaySchool.id)
  await userEvent.selectOptions(groups.getByRole("combobox", { name: "Stage" }), thirdClass.id)
  await userEvent.click(groups.getByRole("button", { name: "Add group" }))
  expect(groups.getByText("Sunday School · 3rd Class")).toBeInTheDocument()
  await userEvent.click(groups.getByRole("button", { name: "Remove Youth Meeting" }))
  await userEvent.click(dialog.getByRole("checkbox", { name: /Servant/ }))
  await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))

  await waitFor(() =>
    expect(sent).toEqual([
      {
        as: "servant",
        roleIds: [servantRole.id],
        assignments: [{ serviceId: sundaySchool.id, stageId: thirdClass.id }],
      },
    ])
  )
})

test("without a named service the servant starts without a group", async () => {
  open()
  servantNamed([])
  const dialog = await openApprove()
  const groups = within(await dialog.findByRole("group", { name: "Groups" }))

  expect(
    groups.getByText("No group yet. A servant without a group sees no service.")
  ).toBeInTheDocument()
})

test("a group the API refuses shows under the groups with the dialog open", async () => {
  open(() =>
    problem(422, "checkFields", {
      fieldErrors: {
        "assignments.0.serviceId": { code: "meetings.serviceArchived", params: { name: "Youth" } },
      },
    })
  )

  servantNamed([youth])
  const dialog = await openApprove()
  await userEvent.click(await dialog.findByRole("checkbox", { name: /Servant/ }))
  await dialog.findByRole("button", { name: "Remove Youth Meeting" })
  await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))
  const groups = within(dialog.getByRole("group", { name: "Groups" }))
  expect(await groups.findByText(/Youth/, { selector: "[data-slot='field-error']" })).toBeVisible()
  expect(screen.getByRole("dialog")).toBeInTheDocument()
})

test("a group the approver may not assign is refused in words", async () => {
  open(() => problem(403, "assignments.notAllowed"))
  servantNamed([youth])
  const dialog = await openApprove()
  await userEvent.click(await dialog.findByRole("checkbox", { name: /Servant/ }))
  await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))

  expect(
    await dialog.findByText("You can’t assign people to this group or take them out of it.")
  ).toBeInTheDocument()
})

test("a 422 roles.unknown shows under the roles with the dialog open", async () => {
  open(() =>
    problem(422, "checkFields", { fieldErrors: { roleIds: { code: "roles.unknown", params: {} } } })
  )

  const dialog = await openApprove(1)
  await userEvent.click(await dialog.findByRole("checkbox", { name: /Servant/ }))
  await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))

  expect(
    await dialog.findByText(/./, { selector: "[data-slot='field-error']" })
  ).toBeInTheDocument()

  expect(screen.getByRole("dialog")).toBeInTheDocument()
})

test("with users:read only the requests show without Approve… or Decline", async () => {
  open(undefined, {
    ...me.churchOffice,
    permissions: [{ action: "read", resource: "users", scope: "church" }],
  })

  await screen.findByRole("heading", { name: "Account requests (2)" })
  expect(screen.queryByRole("button", { name: "Approve…" })).toBeNull()
  expect(screen.queryByRole("button", { name: "Decline" })).toBeNull()
})

test("approving needs roles: update as well as users: update", async () => {
  open(undefined, {
    ...me.administrator,
    permissions: me.administrator.permissions.filter(
      (p) => p.resource !== "roles" || p.action !== "update"
    ),
  })

  await screen.findByRole("heading", { name: "Account requests (2)" })
  expect(screen.queryByRole("button", { name: "Approve…" })).toBeNull()
  expect(screen.getAllByRole("button", { name: "Decline" })).toHaveLength(2)
})
