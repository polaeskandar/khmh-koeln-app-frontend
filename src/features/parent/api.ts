import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import { ApiError } from "@/lib/api/problem"
import type { Uuid } from "@/lib/api/types/common"

export type ChildSummary = Schemas["ChildSummary"]
export type ParentChildren = Schemas["ChildList"]

export type TaskState = "todo" | "done"

export type ParentTask = Schemas["ParentHomeworkItem"]
export type ChildHomework = Schemas["ChildHomeworkList"]

export const parentChildrenQuery = () => ({
  queryKey: ["parent", "children"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/parent/children", { signal })),
})

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

export const useParentChildren = () => useQuery(parentChildrenQuery())

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

export function useSelectedChild(items: ChildSummary[]): ChildSummary | null {
  const wanted = useSearchParams().get("child")

  return items.find((child) => child.id === wanted) ?? items[0] ?? null
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
