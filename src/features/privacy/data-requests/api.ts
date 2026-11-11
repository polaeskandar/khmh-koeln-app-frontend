import { queryOptions } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"
import { DATA_REQUESTS_KEY } from "@/lib/api/query-keys"

export type RequestKind = Schemas["RequestKind"]

export type DataRequestRow = Schemas["DataRequestRowResponse"]

export type DataRequests = Schemas["DataRequestListResponse"]

export const dataRequestsQuery = queryOptions({
  queryKey: [...DATA_REQUESTS_KEY, "list"],
  queryFn: ({ signal }) => dataOf(api.GET("/data-requests", { signal })),
})

export type NewDataRequest = Schemas["RecordDataRequestRequest"]

export const recordDataRequest = (input: NewDataRequest) =>
  dataOf(api.POST("/data-requests", { body: input }))

export type ErasureReview = Schemas["ErasureReviewResponse"]

export type Counts = ErasureReview["erase"]

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

export type MembershipRow = Schemas["MembershipRow"]

export const groupOfMembership = (membership: MembershipRow) =>
  membership.stage ?? membership.service ?? ""

export const dataRequestQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...DATA_REQUESTS_KEY, "detail", id],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/data-requests/{id}", { params: { path: { id } }, signal })),
  })

export const erasureReviewQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...DATA_REQUESTS_KEY, "erasure", id],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/data-requests/{id}/erasure", { params: { path: { id } }, signal })),
  })

export const eraseRequest = (id: Uuid, clearNotes: boolean) =>
  dataOf(api.POST("/data-requests/{id}/erase", { params: { path: { id } }, body: { clearNotes } }))

export type CopyLink = Schemas["CopyLinkResponse"]

export type CopyLinkStatus = Schemas["CopyLinkStatus"]

export const createCopyLinkRequest = (id: Uuid) =>
  dataOf(api.POST("/data-requests/{id}/copy-link", { params: { path: { id } }, body: {} }))

export const DATA_REQUEST_QUERIES = [DATA_REQUESTS_KEY]
