import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import { ApiError } from "@/lib/api/problem"
import type { LocalDate, Uuid } from "@/lib/api/types/common"

export type HomeworkCounts = Schemas["AudienceCounts"]
export type HomeworkFlags = Schemas["HomeworkItem"]["can"]
export type HomeworkRow = Schemas["HomeworkItem"]
export type StageHomework = Schemas["HomeworkList"]

export const stageHomeworkQuery = (stage: Uuid) => ({
  queryKey: ["homework", "list", { stage }] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/stages/{stageId}/homework", { params: { path: { stageId: stage } }, signal })),
})

export const useStageHomework = (stage: Uuid) => useQuery(stageHomeworkQuery(stage))

export type Resource = { label: string; url: string | null }

export type HomeworkDetail = Schemas["HomeworkDetail"]

export type HomeworkInput = {
  title: string
  instructions: string
  dueDate: LocalDate | null
  resources: Resource[]
}

export type SavedHomework = Schemas["HomeworkWritten"]

export const homeworkQuery = (id: Uuid) => ({
  queryKey: ["homework", "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/homework/{id}", { params: { path: { id } }, signal })),
})

export const createHomeworkRequest = (lesson: Uuid, input: HomeworkInput) =>
  dataOf(
    api.POST("/lessons/{lessonId}/homework", {
      params: { path: { lessonId: lesson } },
      body: input,
    })
  )

export const updateHomeworkRequest = (id: Uuid, input: HomeworkInput) =>
  dataOf(api.PATCH("/homework/{id}", { params: { path: { id } }, body: input }))

export type PublishedHomework = Schemas["HomeworkStatusChanged"]

export const publishHomeworkRequest = (id: Uuid) =>
  dataOf(api.POST("/homework/{id}/publish", { params: { path: { id } }, body: {} }))

export type ProgressRow = Schemas["AudienceRow"]
export type HomeworkProgress = Schemas["HomeworkProgress"]

export const homeworkProgressQuery = (id: Uuid) => ({
  queryKey: ["homework", "progress", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/homework/{id}/progress", { params: { path: { id } }, signal })),
})

export type HomeworkTransition = "unpublish" | "archive" | "restore"

export type HomeworkLifecycle = Schemas["HomeworkStatusChanged"]

export const transitionHomeworkRequest = (id: Uuid, transition: HomeworkTransition) => {
  const params = { path: { id } }

  if (transition === "unpublish") {
    return dataOf(api.POST("/homework/{id}/unpublish", { params, body: {} }))
  }

  if (transition === "archive") {
    return dataOf(api.POST("/homework/{id}/archive", { params, body: {} }))
  }

  return dataOf(api.POST("/homework/{id}/restore", { params, body: {} }))
}

export const deleteHomeworkRequest = (id: Uuid) =>
  dataOf(api.DELETE("/homework/{id}", { params: { path: { id } } }))

export type TaskState = "todo" | "done"

export type ParentTask = Schemas["ParentHomeworkItem"]

export type ChildHomework = Schemas["ChildHomeworkList"]

export const childHomeworkQuery = (child: Uuid, state: TaskState) => ({
  queryKey: ["parent", "homework", child, state] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(
      api.GET("/parent/children/{childId}/homework", {
        params: { path: { childId: child }, query: { state } },
        signal,
      })
    ),
})

export function useChildHomework(child: Uuid, state: TaskState) {
  const queryClient = useQueryClient()
  const query = useQuery(childHomeworkQuery(child, state))
  const unlinked = query.error instanceof ApiError && query.error.status === 404

  useEffect(() => {
    if (unlinked) {
      void queryClient.invalidateQueries(
        { queryKey: ["parent", "children"] },
        { cancelRefetch: false }
      )
    }
  }, [unlinked, queryClient])

  return query
}

export type Report = Pick<ParentTask, "done" | "completedAt" | "completedBy" | "completedByYou">

export type ParentTaskDetail = Schemas["ChildHomeworkDetail"]

const taskParams = (child: Uuid, id: Uuid) => ({ path: { childId: child, homeworkId: id } })

export const parentTaskQuery = (child: Uuid, id: Uuid) => ({
  queryKey: ["parent", "task", child, id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(
      api.GET("/parent/children/{childId}/homework/{homeworkId}", {
        params: taskParams(child, id),
        signal,
      })
    ),
})

export const reportDoneRequest = (child: Uuid, id: Uuid) =>
  dataOf(
    api.PUT("/parent/children/{childId}/homework/{homeworkId}/completion", {
      params: taskParams(child, id),
      body: {},
    })
  )

export const undoReportRequest = (child: Uuid, id: Uuid) =>
  dataOf(
    api.DELETE("/parent/children/{childId}/homework/{homeworkId}/completion", {
      params: taskParams(child, id),
    })
  )

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
