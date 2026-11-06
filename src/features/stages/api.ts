import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

export type Stage = Schemas["StageView"]

export const stageQuery = (id: Uuid) => ({
  queryKey: ["stages", "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/stages/{id}", { params: { path: { id } }, signal })),
})
