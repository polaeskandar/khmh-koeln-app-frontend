import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import type { Action, Permission, Resource } from "@/lib/permissions"
import { apiUrl, problem } from "@test/support/api"
import { church, me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { RoleDetail } from "@/features/identity/roles/api"
import { NewRolePage, RolePage } from "@/features/identity/roles/role-editor"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  router.push.mockClear()
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const all: Action[] = ["read", "create", "update", "delete"]

const perms = (resource: Resource, actions: Action[] = all): Permission[] =>
  actions.map((action) => ({ action, resource }))

const SERVANT_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e0006"
const ADMIN_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e0001"

const servant: RoleDetail = {
  id: SERVANT_ID,
  name: "Servant",
  scope: "assignedGroups",
  permissions: [
    ...perms("services", ["read"]),
    ...perms("attendance"),
    ...perms("members"),
    ...perms("lessons"),
    ...perms("homework"),
  ],
  createdAt: "2026-09-01T10:00:00Z",
  updatedAt: "2026-09-01T10:00:00Z",
  holders: [
    { id: "a1", displayName: "Daniel Mikhail", email: "daniel@example.org", disabled: false },
    { id: "a2", displayName: "Samuel Rizk", email: "samuel@example.org", disabled: true },
  ],
  onlyWayToChangeRoles: false,
}

const administrator: RoleDetail = {
  ...servant,
  id: ADMIN_ID,
  name: "Administrator",
  scope: "church",
  permissions: (
    [
      "services",
      "stages",
      "sessions",
      "attendance",
      "members",
      "lessons",
      "homework",
      "users",
      "roles",
    ] as Resource[]
  ).flatMap((r) => perms(r)),
  onlyWayToChangeRoles: true,
}

function open(
  page: React.ReactNode,
  { who = me.administrator, save }: { who?: Me; save?: () => Response } = {}
) {
  const sent: { method: string; body: unknown }[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(who)),
    http.get(apiUrl("/roles"), () =>
      HttpResponse.json({
        items: [
          { id: ADMIN_ID, name: "Administrator", permissions: [], holderCount: 2 },
          { id: SERVANT_ID, name: "Servant", permissions: [], holderCount: 7 },
        ],
      })
    ),
    http.get(apiUrl(`/roles/${SERVANT_ID}`), () => HttpResponse.json(servant)),
    http.get(apiUrl(`/roles/${ADMIN_ID}`), () => HttpResponse.json(administrator)),
    http.post(apiUrl("/roles"), async ({ request }) => {
      sent.push({ method: "POST", body: await request.json() })

      return (
        save?.() ??
        HttpResponse.json({ id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e0099" }, { status: 201 })
      )
    }),
    http.put(apiUrl("/roles/:id"), async ({ request }) => {
      sent.push({ method: "PUT", body: await request.json() })

      return save?.() ?? HttpResponse.json({})
    })
  )

  renderWithProviders(
    <SessionProvider>
      <SidebarProvider>{page}</SidebarProvider>
    </SessionProvider>
  )

  return sent
}

const box = (name: string) => screen.getByRole("checkbox", { name })

test("the Servant role shows its 17 boxes, each named and described by its row", async () => {
  search.value = `id=${SERVANT_ID}`
  open(<RolePage />)
  expect(await screen.findByRole("heading", { name: "Servant", level: 1 })).toBeInTheDocument()
  const boxes = screen.getAllByRole("checkbox")
  expect(boxes).toHaveLength(40)
  expect(boxes.filter((b) => b.getAttribute("aria-checked") === "true")).toHaveLength(17)
  const attendanceAdd = box("Attendance: Add")
  expect(attendanceAdd).toHaveAttribute("aria-checked", "true")
  expect(attendanceAdd).toHaveAccessibleDescription(/^See: attendance lists/)
  expect(screen.getByText("17 of 40 chosen")).toBeInTheDocument()
  expect(screen.getByText("Changes apply to 2 accounts at once.")).toBeInTheDocument()
  expect(screen.getByText("samuel@example.org")).toHaveAttribute("dir", "ltr")
  expect(screen.getByText(/· disabled/)).toBeInTheDocument()
})

test("a role added on an earlier day shows that date", async () => {
  search.value = `id=${SERVANT_ID}`
  open(<RolePage />)

  expect(await screen.findByText("Added on Tue 1 Sep at 12:00")).toBeInTheDocument()
})

test("a role added today says today", async () => {
  search.value = `id=${SERVANT_ID}`
  open(<RolePage />, { who: { ...me.administrator, today: "2026-09-01" } })

  expect(await screen.findByText("Added today at 12:00")).toBeInTheDocument()
})

test("a new role ticks See with Add and is created once", async () => {
  search.value = ""
  const sent = open(<NewRolePage />)
  await userEvent.type(await screen.findByRole("textbox", { name: "Name" }), "Attendance helper")
  await userEvent.click(box("Services: See"))
  await userEvent.click(box("Attendance: Add"))
  expect(box("Attendance: See")).toHaveAttribute("aria-checked", "true")
  expect(screen.getByText("3 of 40 chosen")).toBeInTheDocument()
  await userEvent.dblClick(screen.getByRole("button", { name: "Create role" }))

  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith(
      "/settings/roles/view/?id=0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e0099"
    )
  )

  expect(sent).toEqual([
    {
      method: "POST",
      body: {
        name: "Attendance helper",
        scope: "church",
        permissions: [
          { action: "read", resource: "services" },
          { action: "read", resource: "attendance" },
          { action: "create", resource: "attendance" },
        ],
      },
    },
  ])
})

test("the Servant role applies only in assigned groups, and saving to everywhere sends the scope", async () => {
  search.value = `id=${SERVANT_ID}`
  const sent = open(<RolePage />)
  const scope = await screen.findByRole("radiogroup", { name: "Where it applies" })

  const assigned = within(scope).getByRole("radio", {
    name: /Only in the account’s assigned groups/,
  })

  expect(assigned).toBeChecked()
  await userEvent.click(within(scope).getByRole("radio", { name: /Everywhere in the church/ }))
  await userEvent.click(screen.getByRole("button", { name: "Save changes" }))
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]).toMatchObject({ method: "PUT", body: { name: "Servant", scope: "church" } })
})

test("a new role applies everywhere unless assigned groups are chosen", async () => {
  search.value = ""
  const sent = open(<NewRolePage />)
  await userEvent.type(await screen.findByRole("textbox", { name: "Name" }), "Helpers")
  expect(screen.getByRole("radio", { name: /Everywhere in the church/ })).toBeChecked()

  await userEvent.click(
    screen.getByRole("radio", { name: /Only in the account’s assigned groups/ })
  )

  await userEvent.click(box("Services: See"))
  await userEvent.click(screen.getByRole("button", { name: "Create role" }))
  await waitFor(() => expect(sent).toHaveLength(1))

  expect(sent[0]).toMatchObject({
    method: "POST",
    body: { name: "Helpers", scope: "assignedGroups" },
  })
})

test("unticking See clears the row", async () => {
  open(<NewRolePage />)
  await screen.findByRole("textbox", { name: "Name" })
  await userEvent.click(box("Lessons: Change"))
  await userEvent.click(box("Lessons: Delete"))
  await userEvent.click(box("Lessons: See"))

  for (const action of ["See", "Add", "Change", "Delete"]) {
    expect(box(`Lessons: ${action}`)).toHaveAttribute("aria-checked", "false")
  }
})

test("a name another role has warns and disables Create", async () => {
  const sent = open(<NewRolePage />)
  await userEvent.type(await screen.findByRole("textbox", { name: "Name" }), "  servant ")
  expect(await screen.findByText("There is already a role called “⁨Servant⁩”.")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Create role" })).toBeDisabled()
  expect(sent).toEqual([])
})

test("a role without Services: See warns that it opens nothing", async () => {
  open(<NewRolePage />)
  await screen.findByRole("textbox", { name: "Name" })

  expect(
    screen.getByText(/Accounts with only this role can’t open the staff app/)
  ).toBeInTheDocument()

  await userEvent.click(box("Services: See"))
  expect(screen.queryByText(/Accounts with only this role can’t open/)).not.toBeInTheDocument()
})

test("unticking Roles: Change on the only way warns, and a refusal keeps what was typed", async () => {
  search.value = `id=${ADMIN_ID}`
  open(<RolePage />, { save: () => problem(409, "roles.lastAdministrator") })
  const name = await screen.findByRole("textbox", { name: "Name" })
  await userEvent.click(box("Roles: Change"))
  expect(screen.getByText(/Nobody else can change roles/)).toBeInTheDocument()
  await userEvent.clear(name)
  await userEvent.type(name, "Admins")
  await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "At least one active account must be able to change roles. Give that permission to someone else first."
    )
  )

  expect(name).toHaveValue("Admins")
  expect(box("Roles: Change")).toHaveAttribute("aria-checked", "false")
})

test("with roles: read only everything is read-only", async () => {
  search.value = `id=${SERVANT_ID}`

  open(<RolePage />, {
    who: {
      ...me.churchOffice,
      permissions: [...me.churchOffice.permissions, ...church(...perms("roles", ["read"]))],
    },
  })

  expect(
    await screen.findByText("You can see this role, but your roles don’t let you change it.")
  ).toBeInTheDocument()

  expect(screen.getByRole("textbox", { name: "Name" })).toBeDisabled()
  expect(box("Attendance: Add")).toBeDisabled()
  expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument()
})

test("without roles: read the page says so", async () => {
  search.value = `id=${SERVANT_ID}`
  open(<RolePage />, { who: me.churchOffice })
  expect(await screen.findByText("You can’t see roles")).toBeInTheDocument()
})

test("an unknown role shows not found", async () => {
  search.value = "id=0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e0777"

  server.use(
    http.get(apiUrl("/roles/0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e0777"), () =>
      problem(404, "notFound.role")
    )
  )

  open(<RolePage />)
  expect(await screen.findByText("This page doesn’t exist")).toBeInTheDocument()
})
