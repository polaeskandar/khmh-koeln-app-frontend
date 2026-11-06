import { useQuery } from "@tanstack/react-query"

import type { ParentTask, TaskState } from "@/features/parent/api"
import { api, dataOf, type Schemas } from "@/lib/api/client"

export type MemberGroup = Schemas["MemberGroup"]

export type MemberMeeting = Schemas["MemberMeeting"]

export type MemberTask = ParentTask

export const memberGroupsQuery = () => ({
  queryKey: ["member", "groups"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/member/groups", { signal })),
})

export const memberMeetingsQuery = () => ({
  queryKey: ["member", "meetings"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/member/meetings", { signal })),
})

export const memberHomeworkQuery = (state: TaskState) => ({
  queryKey: ["member", "homework", state] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/member/homework", { params: { query: { state } }, signal })),
})

export const useMemberGroups = () => useQuery(memberGroupsQuery())
export const useMemberMeetings = () => useQuery(memberMeetingsQuery())
export const useMemberHomework = (state: TaskState) => useQuery(memberHomeworkQuery(state))
