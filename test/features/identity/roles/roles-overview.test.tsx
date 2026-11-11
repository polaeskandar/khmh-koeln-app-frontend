import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import type { Action, Permission, Resource } from "@/features/identity/roles/api"
import { apiUrl, problem } from "@test/support/api"
import { church, me } from "@test/support/fixtures/me"
import { answerSettingsLists } from "@test/support/fixtures/settings"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { RoleRow } from "@/features/identity/roles/api"
import { SettingsPage } from "@/features/identity/accounts/settings-page"

beforeEach(() => {
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

const all: Action[] = ["read", "create", "update", "delete"]

const perms = (resource: Resource, actions: Action[] = all): Permission[] =>
  actions.map((action) => ({ action, resource }))

const role = (
  n: number,
  name: string,
  permissions: Permission[],
  holderCount: number,
  scope: RoleRow["scope"] = "church"
): RoleRow => ({
  id: `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e0${String(n).padStart(3, "0")}`,
  name,
  scope,
  permissions,
  holderCount,
})

const roles = [
  role(
    1,
    "Administrator",
    (
      [
        "users",
        "roles",
        "services",
        "stages",
        "sessions",
        "attendance",
        "members",
        "lessons",
        "homework",
      ] as Resource[]
    ).flatMap((r) => perms(r)),
    2
  ),
  role(2, "Attendance helper", [...perms("services", ["read"]), ...perms("attendance")], 3),
  role(3, "Church office", [...perms("users", ["read"]), ...perms("members")], 1),
  role(4, "Lesson preparation", [...perms("services", ["read"]), ...perms("lessons")], 0),
  role(5, "Parent", perms("parentPortal", ["read"]), 40),
  role(
    6,
    "Servant",
    [
      ...perms("services", ["read"]),
      ...perms("attendance"),
      ...perms("members"),
      ...perms("lessons"),
      ...perms("homework"),
    ],
    7,
    "assignedGroups"
  ),
]

const withRoles = (actions: Action[]): Me => ({
  ...me.churchOffice,
  permissions: [...me.churchOffice.permissions, ...church(...perms("roles", actions))],
})

function open(who: Me, remove?: () => Response) {
  let items = roles
  let reads = 0
  const deletes: string[] = []

  answerSettingsLists()

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(who)),
    http.get(apiUrl("/account-requests"), () =>
      HttpResponse.json({ items: [], today: "2026-11-08" })
    ),
    http.get(apiUrl("/roles"), () => {
      reads++

      return HttpResponse.json({ items })
    }),
    http.delete(apiUrl("/roles/:id"), ({ params }) => {
      deletes.push(String(params.id))
      const answer = remove?.()

      if (answer) {
        return answer
      }

      items = items.filter((item) => item.id !== params.id)

      return new HttpResponse(null, { status: 204 })
    })
  )

  renderWithProviders(
    <SessionProvider>
      <SettingsPage />
    </SessionProvider>,
    { sidebar: true }
  )

  return { deletes, reads: () => reads }
}

const rows = async () =>
  within((await screen.findByRole("heading", { name: "Roles" })).closest("section")!)
    .findAllByRole("row")
    .then((all) => all.slice(1))

const rowOf = async (name: string) =>
  (await rows()).find((row) => within(row).queryByRole("link", { name }))!

test("lists the roles by name with what they allow and who has them", async () => {
  open(withRoles(all))
  const list = await rows()

  expect(list.map((row) => within(row).getByRole("link").textContent)).toEqual([
    "Administrator",
    "Attendance helper",
    "Church office",
    "Lesson preparation",
    "Parent",
    "Servant",
  ])

  const servant = await rowOf("Servant")
  expect(servant).toHaveTextContent("17 of 40 permissions")
  expect(servant).toHaveTextContent("Services, Attendance, Members, Lessons and Homework")
  expect(servant).toHaveTextContent("7 accounts")
  expect(servant).toHaveTextContent("In assigned groups")
  expect(await rowOf("Parent")).toHaveTextContent("Everywhere")
  expect(await rowOf("Lesson preparation")).toHaveTextContent("No one")

  expect(within(servant).getByRole("link", { name: "Servant" })).toHaveAttribute(
    "href",
    `/settings/roles/view/?id=${roles[5]!.id}`
  )

  expect(screen.getByRole("link", { name: "New role" })).toHaveAttribute(
    "href",
    "/settings/roles/new/"
  )
})

test("deleting a role says who loses it and refetches", async () => {
  const page = open(withRoles(all))
  const servant = await rowOf("Servant")
  await userEvent.click(within(servant).getByRole("button", { name: "Actions for Servant" }))
  await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  expect(dialog.getByRole("heading")).toHaveTextContent(/^Delete the role “⁨Servant⁩”\?$/)

  expect(
    dialog.getByText("7 accounts have it and lose what it allows at once.")
  ).toBeInTheDocument()

  await userEvent.dblClick(dialog.getByRole("button", { name: "Delete role" }))
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Role “Servant” deleted."))
  expect(page.deletes).toEqual([roles[5]!.id])
  await waitFor(async () => expect(await rows()).toHaveLength(5))
})

test("the last role manager's role stays", async () => {
  open(withRoles(all), () => problem(409, "roles.lastAdministrator"))
  const admin = await rowOf("Administrator")
  await userEvent.click(within(admin).getByRole("button", { name: "Actions for Administrator" }))
  await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }))

  await userEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete role" })
  )

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "At least one active account must be able to change roles. Give that permission to someone else first."
    )
  )

  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  expect(screen.getByText("Administrator", { selector: "bdi" })).toBeInTheDocument()
})

test("with roles: read only there is no New role or menu, and the note says so", async () => {
  open(withRoles(["read"]))
  await rows()
  expect(screen.queryByRole("link", { name: "New role" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: /^Actions for/ })).not.toBeInTheDocument()
  expect(screen.getByText(/Your roles let you see roles, not change them\./)).toBeInTheDocument()
})

test("without roles: read the section is absent and roles are never asked for", async () => {
  const page = open(me.churchOffice)
  await screen.findByRole("heading", { level: 1 })
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(screen.queryByRole("heading", { name: "Roles" })).not.toBeInTheDocument()
  expect(page.reads()).toBe(0)
})
