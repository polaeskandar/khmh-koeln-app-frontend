import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { LocalDate, Uuid } from "@/lib/api/types/common"

export type RequestKind = Schemas["RequestKind"]
export type RequestChannel = Schemas["RequestChannel"]
export type RequestStatus = Schemas["RequestStatus"]

export type DataRequestRow = Schemas["DataRequestRowResponse"]

export type DataRequests = Schemas["DataRequestListResponse"]

export const dataRequestsQuery = {
  queryKey: ["data-requests", "list"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/data-requests", { signal })),
}

export type NewDataRequest = Schemas["RecordDataRequestRequest"]

export const recordDataRequest = (input: NewDataRequest) =>
  dataOf(api.POST("/data-requests", { body: input }))

export type AccountChoice = Schemas["ParentAccessListResponse"]["accounts"][number]

export const accountChoicesQuery = {
  queryKey: ["guardian-links"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/guardian-links", { signal })),
}

export type ErasureReview = Schemas["ErasureReviewResponse"]

export type Counts = ErasureReview["erase"]

export type Mention = Schemas["Mention"]

const MENTION_LABELS = {
  sessionNote: "sessionNote",
  removalReason: "correctionNote",
  cancelReason: "cancelReason",
  lessonNote: "lessonNote",
} as const

export type MentionLabel = (typeof MENTION_LABELS)[keyof typeof MENTION_LABELS]

const isMentionPlace = (where: string): where is keyof typeof MENTION_LABELS =>
  Object.hasOwn(MENTION_LABELS, where)

export const mentionLabelOf = (where: string): MentionLabel | null =>
  isMentionPlace(where) ? MENTION_LABELS[where] : null

export type DataRequestDetail = Schemas["DataRequestDetailResponse"]

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

export const erasureReviewQuery = (id: Uuid) => ({
  queryKey: ["data-requests", "erasure", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/data-requests/{id}/erasure", { params: { path: { id } }, signal })),
})

export const eraseRequest = (id: Uuid, clearNotes: boolean) =>
  dataOf(api.POST("/data-requests/{id}/erase", { params: { path: { id } }, body: { clearNotes } }))
