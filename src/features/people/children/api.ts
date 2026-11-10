import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import { PARENT_KEY } from "@/lib/api/query-keys"

export type ChildSummary = Schemas["ChildSummaryResponse"]

export type ParentChildren = Schemas["ChildListResponse"]

export const parentChildrenQuery = () => ({
  queryKey: [...PARENT_KEY, "children"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/parent/children", { signal })),
})

export const useParentChildren = () => useQuery(parentChildrenQuery())

export function useSelectedChild(items: ChildSummary[]): ChildSummary | null {
  const wanted = useSearchParams().get("child")

  return items.find((child) => child.id === wanted) ?? items[0] ?? null
}
