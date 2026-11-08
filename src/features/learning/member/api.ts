import { useQuery } from "@tanstack/react-query"

import type { ParentTask, TaskState } from "@/features/learning/parent/api"
import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

export type MemberTask = ParentTask

export const memberHomeworkQuery = (state: TaskState) => ({
  queryKey: ["member", "homework", state] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/member/homework", { params: { query: { state } }, signal })),
})

export const useMemberHomework = (state: TaskState) => useQuery(memberHomeworkQuery(state))

export type MemberTaskDetail = Schemas["MemberHomeworkDetail"]

export const memberTaskQuery = (id: Uuid) => ({
  queryKey: ["member", "task", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(
      api.GET("/member/homework/{homeworkId}", { params: { path: { homeworkId: id } }, signal })
    ),
})

export const reportOwnDoneRequest = (id: Uuid) =>
  dataOf(
    api.PUT("/member/homework/{homeworkId}/completion", {
      params: { path: { homeworkId: id } },
      body: {},
    })
  )

export const undoOwnReportRequest = (id: Uuid) =>
  dataOf(
    api.DELETE("/member/homework/{homeworkId}/completion", {
      params: { path: { homeworkId: id } },
    })
  )
