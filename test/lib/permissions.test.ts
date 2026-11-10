import { describe, expect, test } from "vitest"

import {
  can,
  type Can,
  canAssign,
  canInAny,
  type Group,
  type Holder,
  isUnassigned,
  meetingGroup,
} from "@/lib/permissions"

const SUNDAY_SCHOOL = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f10"
const THIRD_CLASS = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f22"
const FIRST_CLASS = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f21"
const YOUTH = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f11"

const sundaySchool: Group = { serviceId: SUNDAY_SCHOOL, stageId: null }
const thirdClass: Group = { serviceId: SUNDAY_SCHOOL, stageId: THIRD_CLASS }
const firstClass: Group = { serviceId: SUNDAY_SCHOOL, stageId: FIRST_CLASS }
const youth: Group = { serviceId: YOUTH, stageId: null }

const serving = (serviceId: string, stageId: string | null = null) => ({
  service: { id: serviceId },
  stage: stageId ? { id: stageId } : null,
})

const holder = (scope: "church" | "assignedGroups", assignments: Holder["assignments"] = []) => ({
  permissions: [
    { action: "create" as const, resource: "attendance" as const, scope },
    { action: "read" as const, resource: "users" as const, scope },
  ],
  assignments,
})

describe("can", () => {
  test("a church role holds everywhere, with or without a group", () => {
    const office = holder("church")
    expect(can(office, "create", "attendance")).toBe(true)
    expect(can(office, "create", "attendance", thirdClass)).toBe(true)
    expect(can(office, "create", "attendance", youth)).toBe(true)
    expect(can(office, "delete", "attendance", youth)).toBe(false)
  })

  test("an assigned role without an assignment holds nowhere", () => {
    const servant = holder("assignedGroups")
    expect(can(servant, "create", "attendance")).toBe(false)
    expect(can(servant, "create", "attendance", thirdClass)).toBe(false)
  })

  test("an assigned role holds where an assignment covers the group", () => {
    const servant = holder("assignedGroups", [serving(SUNDAY_SCHOOL, THIRD_CLASS)])
    expect(can(servant, "create", "attendance")).toBe(true)
    expect(can(servant, "create", "attendance", thirdClass)).toBe(true)
    expect(can(servant, "create", "attendance", firstClass)).toBe(false)
    expect(can(servant, "create", "attendance", sundaySchool)).toBe(false)
    expect(can(servant, "create", "attendance", youth)).toBe(false)
  })

  test("a service assignment covers the service's own roster and all its stages", () => {
    const leader = holder("assignedGroups", [serving(SUNDAY_SCHOOL)])
    expect(can(leader, "create", "attendance", sundaySchool)).toBe(true)
    expect(can(leader, "create", "attendance", thirdClass)).toBe(true)
    expect(can(leader, "create", "attendance", firstClass)).toBe(true)
    expect(can(leader, "create", "attendance", youth)).toBe(false)
  })

  test("users, roles and the parent portal hold by permission alone", () => {
    expect(can(holder("assignedGroups"), "read", "users")).toBe(true)
  })

  test("nobody signed in may do nothing", () => {
    expect(can(null, "create", "attendance")).toBe(false)
  })

  test("canInAny asks each group, or asks without one when there is none", () => {
    const servant = holder("assignedGroups", [serving(SUNDAY_SCHOOL, THIRD_CLASS)])
    const asked: Can = (action, resource, group) => can(servant, action, resource, group)
    const office: Can = (action, resource, group) => can(holder("church"), action, resource, group)
    expect(canInAny(asked, "create", "attendance", [youth, thirdClass])).toBe(true)
    expect(canInAny(asked, "create", "attendance", [youth, firstClass])).toBe(false)
    expect(canInAny(asked, "create", "attendance", [])).toBe(true)
    expect(canInAny(office, "create", "attendance", [])).toBe(true)
  })

  test("a meeting without a service has no group", () => {
    expect(meetingGroup({ service: null, stage: null })).toBeUndefined()

    expect(meetingGroup({ service: { id: SUNDAY_SCHOOL }, stage: { id: THIRD_CLASS } })).toEqual(
      thirdClass
    )
  })
})

describe("canAssign", () => {
  const leading = (scope: "church" | "assignedGroups", assignments: Holder["assignments"]) => ({
    permissions: [{ action: "update" as const, resource: "stages" as const, scope }],
    assignments,
  })

  test("users: update or stages: update from a church role assigns anywhere", () => {
    const admin = {
      permissions: [
        { action: "update" as const, resource: "users" as const, scope: "church" as const },
      ],
      assignments: [],
    }

    expect(canAssign(admin)).toBe(true)
    expect(canAssign(admin, youth)).toBe(true)
    expect(canAssign(leading("church", []), thirdClass)).toBe(true)
  })

  test("an assigned leader assigns only within the services it holds as a whole", () => {
    const leader = leading("assignedGroups", [serving(SUNDAY_SCHOOL)])
    expect(canAssign(leader)).toBe(true)
    expect(canAssign(leader, thirdClass)).toBe(true)
    expect(canAssign(leader, sundaySchool)).toBe(true)
    expect(canAssign(leader, youth)).toBe(false)
  })

  test("a stage assignment or no stages: update assigns nowhere", () => {
    expect(canAssign(leading("assignedGroups", [serving(SUNDAY_SCHOOL, THIRD_CLASS)]))).toBe(false)
    expect(canAssign(holder("assignedGroups", [serving(SUNDAY_SCHOOL)]))).toBe(false)
    expect(canAssign(null)).toBe(false)
  })
})

describe("isUnassigned", () => {
  test("only an account whose group permissions all wait for an assignment", () => {
    expect(isUnassigned(holder("assignedGroups"))).toBe(true)
    expect(isUnassigned(holder("assignedGroups", [serving(YOUTH)]))).toBe(false)
    expect(isUnassigned(holder("church"))).toBe(false)
    expect(isUnassigned({ permissions: [], assignments: [] })).toBe(false)
    expect(isUnassigned(null)).toBe(false)
  })
})
