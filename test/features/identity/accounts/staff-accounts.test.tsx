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
import { services } from "@test/support/fixtures/services"
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

const roleRows = roles.map((r) => ({
  ...r,
  scope: r === servant ? ("assignedGroups" as const) : ("church" as const),
  permissions: [],
  holderCount: 1,
}))

const sundaySchool = services.items[0]!
const thirdClass = sundaySchool.stages[2]!
const youth = services.items[1]!

const serviceRef = ({ id, name, tone, archived }: typeof sundaySchool) => ({
  id,
  name,
  tone,
  archived,
})

const stageRef = ({ id, name, position }: typeof thirdClass) => ({
  id,
  name,
  position,
  archived: false,
})

const inThirdClass: StaffAccount["assignments"][number] = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea001",
  service: serviceRef(sundaySchool),
  stage: stageRef(thirdClass),
}

const account = (
  n: number,
  displayName: string,
  had: typeof roles,
  disabled = false,
  assignments: StaffAccount["assignments"] = []
): StaffAccount => ({
  id: `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef${String(n).padStart(3, "0")}`,
  displayName,
  email: `${displayName.split(" ")[0]!.toLowerCase()}@example.org`,
  disabled,
  roles: had,
  assignments,
})

const mariam = account(1, "Mariam Fahmy", [administrator])
const rebecca = account(2, "Rebecca Girgis", [servant])
const sara = account(3, "Sara Wissa", [office])
const samuel = account(4, "Samuel Rizk", [servant], true)
const daniel = account(5, "Daniel Mikhail", [servant], false, [inThirdClass])

function open({
  remove,
  link,
  assign,
  who = me.administrator,
  accounts = [mariam, rebecca, sara, samuel],
}: {
  remove?: () => Response
  link?: () => Response
  assign?: () => Response
  who?: Me
  accounts?: StaffAccount[]
} = {}) {
  let items = accounts
  const sent: string[] = []
  const reads = { roles: 0 }

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(who)),
    http.get(apiUrl("/staff-accounts"), () => HttpResponse.json({ today: "2026-11-08", items })),
    http.get(apiUrl("/roles"), () => {
      reads.roles++

      return HttpResponse.json({ items: roleRows })
    }),
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.post(apiUrl("/accounts/:id/assignments"), async ({ params, request }) => {
      const body = (await request.json()) as Schemas["AssignmentRequest"]
      sent.push(`assign ${params.id} ${body.serviceId} ${body.stageId}`)
      const refused = assign?.()

      if (refused) {
        return refused
      }

      const service = services.items.find((option) => option.id === body.serviceId)!
      const stage = service.stages.find((option) => option.id === body.stageId)

      const created = {
        id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea099",
        service: serviceRef(service),
        stage: stage ? stageRef(stage) : null,
      }

      items = items.map((item) =>
        item.id === params.id ? { ...item, assignments: [...item.assignments, created] } : item
      )

      return HttpResponse.json(created, { status: 201 })
    }),
    http.delete(apiUrl("/assignments/:id"), ({ params }) => {
      sent.push(`unassign ${params.id}`)

      items = items.map((item) => ({
        ...item,
        assignments: item.assignments.filter((assignment) => assignment.id !== params.id),
      }))

      return new HttpResponse(null, { status: 204 })
    }),
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

  return { sent, client, reads }
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
  const { sent, reads } = open()
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

  await waitFor(() => expect(reads.roles).toBe(2))
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

  expect(
    await dialog.findByText("Sent to sara@example.org. Works until on Mon 9 Nov at 12:00.")
  ).toBeInTheDocument()

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

const openAssign = async (name: string) => {
  await userEvent.click(
    await within(await rowOf(name)).findByRole("button", { name: `Assign ${name} to a group…` })
  )

  return within(await screen.findByRole("dialog"))
}

test("each account shows its groups; a servant without one says so", async () => {
  open({ accounts: [mariam, rebecca, daniel] })
  const danielRow = within(await rowOf("Daniel Mikhail"))
  expect(await danielRow.findByText("Sunday School · 3rd Class")).toBeInTheDocument()

  expect(
    await within(await rowOf("Rebecca Girgis")).findByText(
      "No group yet: sees no service until assigned."
    )
  ).toBeInTheDocument()

  expect(within(await rowOf("Mariam Fahmy")).queryByText(/No group yet/)).toBeNull()
})

test("assigning a group sends the service and stage once and shows the chip", async () => {
  const { sent } = open()
  const dialog = await openAssign("Rebecca Girgis")
  expect(dialog.getByText("Assign ⁨Rebecca Girgis⁩ to a group")).toBeInTheDocument()
  expect(dialog.getByRole("button", { name: "Assign" })).toBeDisabled()
  const service = dialog.getByRole("combobox", { name: "Service" })
  expect(within(service).queryByRole("option", { name: "Choir" })).toBeNull()
  await userEvent.selectOptions(service, sundaySchool.id)
  const stage = dialog.getByRole("combobox", { name: "Stage" })
  expect(stage).toHaveValue("")
  expect(within(stage).getAllByRole("option")[0]).toHaveTextContent("The whole service")
  await userEvent.selectOptions(stage, thirdClass.id)
  await userEvent.dblClick(dialog.getByRole("button", { name: "Assign" }))

  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "⁨Rebecca Girgis⁩ now serves in ⁨Sunday School · 3rd Class⁩."
    )
  )

  expect(sent).toEqual([`assign ${rebecca.id} ${sundaySchool.id} ${thirdClass.id}`])

  expect(
    await within(await rowOf("Rebecca Girgis")).findByText("Sunday School · 3rd Class")
  ).toBeInTheDocument()
})

test("a service without stages is assigned as a whole", async () => {
  const { sent } = open()
  const dialog = await openAssign("Sara Wissa")
  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Service" }), youth.id)
  expect(dialog.queryByRole("combobox", { name: "Stage" })).toBeNull()
  await userEvent.click(dialog.getByRole("button", { name: "Assign" }))
  await waitFor(() => expect(sent).toEqual([`assign ${sara.id} ${youth.id} null`]))
})

test("an account already in the group keeps the dialog open with the reason", async () => {
  open({
    assign: () =>
      problem(409, "assignments.alreadyAssigned", {
        params: { name: "Rebecca Girgis", where: "Youth" },
      }),
  })

  const dialog = await openAssign("Rebecca Girgis")
  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Service" }), youth.id)
  await userEvent.click(dialog.getByRole("button", { name: "Assign" }))

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("Rebecca Girgis is already assigned to Youth.")
  )

  expect(screen.getByRole("dialog")).toBeInTheDocument()
})

test("a refused assignment says who may assign", async () => {
  open({ assign: () => problem(403, "assignments.notAllowed") })
  const dialog = await openAssign("Rebecca Girgis")
  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Service" }), youth.id)
  await userEvent.click(dialog.getByRole("button", { name: "Assign" }))

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "You can’t assign people to this group or take them out of it."
    )
  )
})

test("taking someone out of a group asks first and removes the chip", async () => {
  const { sent } = open({ accounts: [daniel] })
  const row = within(await rowOf("Daniel Mikhail"))

  await userEvent.click(
    await row.findByRole("button", { name: "Take Daniel Mikhail out of Sunday School · 3rd Class" })
  )

  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.click(dialog.getByRole("button", { name: "Take out" }))
  await waitFor(() => expect(sent).toEqual([`unassign ${inThirdClass.id}`]))

  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "⁨Daniel Mikhail⁩ no longer serves in ⁨Sunday School · 3rd Class⁩."
    )
  )

  await waitFor(() => expect(screen.queryByText("Sunday School · 3rd Class")).toBeNull())
})

test("without the right to assign, groups show without Take out or Group", async () => {
  open({
    accounts: [daniel],
    who: {
      ...me.churchOffice,
      permissions: [{ action: "read", resource: "users", scope: "church" }],
    },
  })

  const row = within(await rowOf("Daniel Mikhail"))
  expect(await row.findByText("Sunday School · 3rd Class")).toBeInTheDocument()
  expect(row.queryByRole("button", { name: /^Take / })).toBeNull()
  expect(row.queryByRole("button", { name: /to a group…$/ })).toBeNull()
})
