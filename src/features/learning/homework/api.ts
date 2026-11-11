import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import { ApiError } from "@/lib/api/problem"
import type { Uuid } from "@/lib/api/types/common"
import type { Can } from "@/lib/permissions"

export type HomeworkCounts = Schemas["AudienceCountsResponse"]
export type HomeworkRow = Schemas["HomeworkItemResponse"]
export type StageHomework = Schemas["HomeworkListResponse"]

export const stageHomeworkQuery = (stage: Uuid) => ({
  queryKey: ["homework", "list", { stage }] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/stages/{stageId}/homework", { params: { path: { stageId: stage } }, signal })),
})

export const useStageHomework = (stage: Uuid) => useQuery(stageHomeworkQuery(stage))

export type HomeworkDetail = Schemas["HomeworkDetailResponse"]

export type Resource = HomeworkDetail["resources"][number]

export type HomeworkInput = Schemas["HomeworkRequest"]

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

export const updateHomeworkRequest = (id: Uuid, version: number, input: HomeworkInput) =>
  dataOf(api.PUT("/homework/{id}", { params: { path: { id }, query: { version } }, body: input }))

export const publishHomeworkRequest = (id: Uuid) =>
  dataOf(api.POST("/homework/{id}/publish", { params: { path: { id } }, body: {} }))

export type ProgressRow = Schemas["AudienceRowResponse"]
export type HomeworkProgress = Schemas["HomeworkProgressResponse"]

export const homeworkProgressQuery = (id: Uuid) => ({
  queryKey: ["homework", "progress", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/homework/{id}/progress", { params: { path: { id } }, signal })),
})

export type HomeworkTransition = "unpublish" | "archive" | "restore"

export type HomeworkFlags = Record<
  "edit" | "publish" | "unpublish" | "archive" | "restore" | "delete" | "viewProgress",
  boolean
>

export type HomeworkState = Pick<HomeworkRow, "status" | "publishedAt" | "counts"> & {
  lesson: Pick<HomeworkRow["lesson"], "archived">
}

export function homeworkFlagsFor(
  can: Can,
  { status, publishedAt, counts, lesson }: HomeworkState,
  stageArchived: boolean
): HomeworkFlags {
  const update = can("update", "homework") && !stageArchived
  const edit = update && status !== "archived" && !lesson.archived

  return {
    edit,
    publish: edit && status === "draft",
    unpublish: update && status === "published" && (counts?.reportedTotal ?? 0) === 0,
    archive: update && status !== "archived",
    restore: update && status === "archived" && !lesson.archived,
    delete: update && publishedAt === null,
    viewProgress: can("read", "members"),
  }
}

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

export type ParentTask = Schemas["ParentHomeworkItemResponse"]

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

export type ParentTaskDetail = Schemas["ChildHomeworkDetailResponse"]

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

export type MemberTaskDetail = Schemas["MemberHomeworkDetailResponse"]

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
