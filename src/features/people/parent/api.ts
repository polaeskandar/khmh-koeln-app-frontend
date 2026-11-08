import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"

import { api, dataOf, type Schemas } from "@/lib/api/client"

export type ChildSummary = Schemas["ChildSummary"]
export type ParentChildren = Schemas["ChildList"]

export const parentChildrenQuery = () => ({
  queryKey: ["parent", "children"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/parent/children", { signal })),
})

export const useParentChildren = () => useQuery(parentChildrenQuery())

export function useSelectedChild(items: ChildSummary[]): ChildSummary | null {
  const wanted = useSearchParams().get("child")

  return items.find((child) => child.id === wanted) ?? items[0] ?? null
}
