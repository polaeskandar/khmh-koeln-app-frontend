import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { parentChildrenQuery } from "@/features/people/children/api"
import { api, dataOf, type Schemas } from "@/lib/api/client"
import { ApiError } from "@/lib/api/problem"
import { HOMEWORK_KEY, LESSONS_KEY, MEMBER_KEY, PARENT_KEY } from "@/lib/api/query-keys"
import type { Uuid } from "@/lib/api/types/common"
import type { Can } from "@/lib/permissions"

export type HomeworkCounts = Schemas["AudienceCountsResponse"]
export type HomeworkRow = Schemas["HomeworkItemResponse"]
export type StageHomework = Schemas["HomeworkListResponse"]

export const stageHomeworkQuery = (stage: Uuid) =>
  queryOptions({
    queryKey: [...HOMEWORK_KEY, "list", { stage }],
    queryFn: ({ signal }) =>
      dataOf(
        api.GET("/stages/{stageId}/homework", { params: { path: { stageId: stage } }, signal })
      ),
  })

export type HomeworkDetail = Schemas["HomeworkDetailResponse"]

export type Resource = HomeworkDetail["resources"][number]

export type HomeworkInput = Schemas["HomeworkRequest"]

export const homeworkQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...HOMEWORK_KEY, "detail", id],
    queryFn: ({ signal }) =>
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

export const homeworkProgressQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...HOMEWORK_KEY, "progress", id],
    queryFn: ({ signal }) =>
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

const childHomeworkQuery = (child: Uuid, state: TaskState) =>
  queryOptions({
    queryKey: [...PARENT_KEY, "homework", child, state],
    queryFn: ({ signal }) =>
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
        { queryKey: parentChildrenQuery.queryKey },
        { cancelRefetch: false }
      )
    }
  }, [unlinked, queryClient])

  return query
}

export type Report = Pick<ParentTask, "done" | "completedAt" | "completedBy" | "completedByYou">

export type ParentTaskDetail = Schemas["ChildHomeworkDetailResponse"]

const taskParams = (child: Uuid, id: Uuid) => ({ path: { childId: child, homeworkId: id } })

export const parentTaskQuery = (child: Uuid, id: Uuid) =>
  queryOptions({
    queryKey: [...PARENT_KEY, "task", child, id],
    queryFn: ({ signal }) =>
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

export const memberHomeworkQuery = (state: TaskState) =>
  queryOptions({
    queryKey: [...MEMBER_KEY, "homework", state],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/member/homework", { params: { query: { state } }, signal })),
  })

export type MemberTaskDetail = Schemas["MemberHomeworkDetailResponse"]

export const memberTaskQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...MEMBER_KEY, "task", id],
    queryFn: ({ signal }) =>
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

export const HOMEWORK_QUERIES = [HOMEWORK_KEY]

export const HOMEWORK_SAVE_QUERIES = [HOMEWORK_KEY, LESSONS_KEY]

export const CHILD_REPORT_QUERIES = [PARENT_KEY]

export const OWN_REPORT_QUERIES = [MEMBER_KEY]
