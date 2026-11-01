import type { Me } from "@/features/auth/api"
import type { Action, Permission, Resource } from "@/lib/permissions"

const ACTIONS: Action[] = ["read", "create", "update", "delete"]

const crud = (...resources: Resource[]): Permission[] =>
  resources.flatMap((resource) => ACTIONS.map((action) => ({ action, resource })))

const read = (...resources: Resource[]): Permission[] =>
  resources.map((resource) => ({ action: "read", resource }))

const role = (n: number, name: string) => ({ id: `019a3f00-0000-7000-8000-00000000000${n}`, name })

const ADMINISTRATOR = role(1, "Administrator")
const SERVICE_LEADER = role(2, "Service leader")
const SERVANT = role(3, "Servant")
const PARENT = role(4, "Parent")
const CHURCH_OFFICE = role(5, "Church office")
const ATTENDANCE = role(6, "Attendance")

const servantPermissions = [
  ...read("services", "stages", "sessions", "members"),
  ...crud("attendance", "lessons", "homework"),
]

const account = (displayName: string, roles: Me["roles"], permissions: Permission[]): Me => ({
  account: {
    id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f01",
    email: `${displayName.split(" ")[0].toLowerCase()}@example.org`,
    displayName,
    language: "en",
  },
  roles,
  permissions,
  today: "2026-11-08",
  member: null,
})

export const me = {
  administrator: account(
    "Mariam Fahmy",
    [ADMINISTRATOR],
    crud(
      "users",
      "roles",
      "services",
      "stages",
      "sessions",
      "attendance",
      "members",
      "lessons",
      "homework"
    )
  ),
  leader: account(
    "Bishoy Tadros",
    [SERVICE_LEADER],
    [
      ...servantPermissions,
      ...crud("stages", "sessions", "members"),
      { action: "update", resource: "services" },
    ]
  ),
  servant: account("Daniel Mikhail", [SERVANT], servantPermissions),
  churchOffice: account(
    "Nadia Saad",
    [CHURCH_OFFICE],
    [...read("services", "users"), { action: "delete", resource: "users" }, ...crud("members")]
  ),
  attendanceOnly: account(
    "Youssef Awad",
    [ATTENDANCE],
    [
      { action: "read", resource: "attendance" },
      { action: "create", resource: "attendance" },
    ]
  ),
  parent: account("Mariam Hanna", [PARENT], read("parentPortal")),
  staffAndParent: account(
    "Mina Girgis",
    [SERVANT, PARENT],
    [...servantPermissions, ...read("parentPortal")]
  ),
  noRoles: account("Sara Wissa", [], []),
}
