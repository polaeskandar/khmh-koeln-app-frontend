import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"

import { api, dataOf, type Schemas } from "@/lib/api/client"
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

export const useChildHomework = (child: Uuid, state: TaskState) =>
  useQuery(childHomeworkQuery(child, state))

export function useSelectedChild(items: ChildSummary[]): ChildSummary | null {
  const wanted = useSearchParams().get("child")

  return items.find((child) => child.id === wanted) ?? items[0] ?? null
}
