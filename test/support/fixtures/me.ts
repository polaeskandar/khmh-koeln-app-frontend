import type { Me } from "@/features/identity/auth/api"
import type { AccountPermission, Action, Resource, RoleScope } from "@/lib/permissions"
import { services } from "@test/support/fixtures/services"

const ACTIONS: Action[] = ["read", "create", "update", "delete"]

type Grant = { action: Action; resource: Resource }

const crud = (...resources: Resource[]): Grant[] =>
  resources.flatMap((resource) => ACTIONS.map((action) => ({ action, resource })))

const read = (...resources: Resource[]): Grant[] =>
  resources.map((resource) => ({ action: "read", resource }))

const scoped = (scope: RoleScope, grants: Grant[]): AccountPermission[] =>
  grants.map((grant) => ({ ...grant, scope }))

export const church = (...grants: Grant[]) => scoped("church", grants)

const inGroups = (...grants: Grant[]) => scoped("assignedGroups", grants)

const role = (n: number, name: string) => ({ id: `019a3f00-0000-7000-8000-00000000000${n}`, name })

const ADMINISTRATOR = role(1, "Administrator")
const SERVICE_LEADER = role(2, "Service leader")
const SERVANT = role(3, "Servant")
const PARENT = role(4, "Parent")
const CHURCH_OFFICE = role(5, "Church office")
const ATTENDANCE = role(6, "Attendance")

type Assigned = Me["assignments"][number]

const serviceRef = (n: number, name: string, tone: number) => ({
  id: `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f1${n}`,
  name,
  tone,
  archived: false,
})

const SUNDAY_SCHOOL = serviceRef(0, "Sunday School", 1)

const serving = (service: Assigned["service"]): Assigned => ({ service, stage: null })

const sundaySchoolAssignment = serving(SUNDAY_SCHOOL)

const testedGroups: Assigned[] = [
  sundaySchoolAssignment,
  serving(serviceRef(1, "Youth Meeting", 2)),
  serving(serviceRef(2, "Choir", 3)),
  serving(serviceRef(7, "Bible Study", 7)),
  ...services.items.map(({ id, name, tone, archived }) => serving({ id, name, tone, archived })),
]

const servantGrants = [
  ...read("services", "stages", "sessions", "members"),
  ...crud("attendance", "lessons", "homework"),
]

const account = (
  displayName: string,
  roles: Me["roles"],
  permissions: AccountPermission[],
  assignments: Me["assignments"] = []
): Me => ({
  account: {
    id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f01",
    email: `${displayName.split(" ")[0].toLowerCase()}@example.org`,
    displayName,
    language: "en",
  },
  roles,
  permissions,
  assignments,
  member: null,
  today: "2026-11-08",
})

export const me = {
  administrator: account(
    "Mariam Fahmy",
    [ADMINISTRATOR],
    church(
      ...crud(
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
    )
  ),
  leader: account(
    "Bishoy Tadros",
    [SERVICE_LEADER],
    inGroups(...servantGrants, ...crud("stages", "sessions", "members"), {
      action: "update",
      resource: "services",
    }),
    testedGroups
  ),
  servant: account("Daniel Mikhail", [SERVANT], inGroups(...servantGrants), testedGroups),
  churchOffice: account(
    "Nadia Saad",
    [CHURCH_OFFICE],
    church(
      ...read("services", "users"),
      { action: "delete", resource: "users" },
      ...crud("members")
    )
  ),
  attendanceOnly: account(
    "Youssef Awad",
    [ATTENDANCE],
    church({ action: "read", resource: "attendance" }, { action: "create", resource: "attendance" })
  ),
  parent: account("Mariam Hanna", [PARENT], church(...read("parentPortal"))),
  staffAndParent: account(
    "Mina Girgis",
    [SERVANT, PARENT],
    [...inGroups(...servantGrants), ...church(...read("parentPortal"))],
    testedGroups
  ),
  noRoles: account("Sara Wissa", [], []),
}
