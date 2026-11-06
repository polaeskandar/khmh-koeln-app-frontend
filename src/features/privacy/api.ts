import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { LocalDate, Uuid } from "@/lib/api/types/common"

export type RequestKind = Schemas["RequestKind"]
export type RequestChannel = Schemas["RequestChannel"]
export type RequestStatus = Schemas["RequestStatus"]

export type DataRequestRow = Schemas["DataRequestRow"]

export type DataRequests = Schemas["DataRequestList"]

export const dataRequestsQuery = {
  queryKey: ["data-requests", "list"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/data-requests", { signal })),
}

export type NewDataRequest = Schemas["RecordDataRequestCommand"]

export const recordDataRequest = (input: NewDataRequest) =>
  dataOf(api.POST("/data-requests", { body: input }))

export type AccountChoice = { id: Uuid; name: string; email: string }

export const accountChoicesQuery = {
  queryKey: ["guardian-links"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/guardian-links", { signal })),
}

export type EraseCounts = {
  person: number
  memberships: number
  attendance: number
  completions: number
  guardianLinks: number
  account: number
  roles: number
}

export type KeepCounts = {
  sessionTotals: number
  recordedMarks: number
  reportedCompletions: number
  lessons: number
  homework: number
  sessionHistory: number
}

export type Mention = Schemas["Mention"]

const MENTION_PLACES = ["sessionNote", "correctionNote", "cancelReason", "lessonNote"] as const

export type MentionPlace = (typeof MENTION_PLACES)[number]

export const isMentionPlace = (where: string): where is MentionPlace =>
  MENTION_PLACES.some((place) => place === where)

export type DataRequestDetail = Schemas["DataRequestDetail"]

const textOf = (value: unknown) => (typeof value === "string" ? value : null)

export type MemberRecord = {
  firstName: string
  lastName: string
  displayName: string | null
  memberships: { group: string; from: LocalDate; until: LocalDate | null }[]
}

export function memberRecordOf(member: NonNullable<DataRequestDetail["member"]>): MemberRecord {
  const rows = Array.isArray(member.memberships) ? member.memberships : []

  return {
    firstName: textOf(member.firstName) ?? "",
    lastName: textOf(member.lastName) ?? "",
    displayName: textOf(member.displayName),
    memberships: rows.map((row) => ({
      group: textOf(row.stage) ?? textOf(row.service) ?? "",
      from: textOf(row.from) ?? "",
      until: textOf(row.until),
    })),
  }
}

export type AccountRecord = { name: string; email: string; roles: string[] }

export function accountRecordOf(account: NonNullable<DataRequestDetail["account"]>): AccountRecord {
  const roles = account.roles

  return {
    name: textOf(account.name) ?? "",
    email: textOf(account.email) ?? "",
    roles: Array.isArray(roles) ? roles : [],
  }
}

export const dataRequestQuery = (id: Uuid) => ({
  queryKey: ["data-requests", "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/data-requests/{id}", { params: { path: { id } }, signal })),
})

export const eraseRequest = (id: Uuid, clearNotes: boolean) =>
  dataOf(api.POST("/data-requests/{id}/erase", { params: { path: { id } }, body: { clearNotes } }))
