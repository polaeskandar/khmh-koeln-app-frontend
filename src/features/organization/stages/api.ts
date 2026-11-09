import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

export type Stage = Schemas["StageView"]

export const stageQuery = (id: Uuid) => ({
  queryKey: ["stages", "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/stages/{id}", { params: { path: { id } }, signal })),
})

export type StageFields = { name: string; description: string | null }

export const addStageRequest = (service: Uuid, fields: StageFields) =>
  dataOf(api.POST("/services/{id}/stages", { params: { path: { id: service } }, body: fields }))

export const updateStageRequest = (stage: Uuid, changes: Partial<StageFields>) =>
  dataOf(api.PATCH("/stages/{id}", { params: { path: { id: stage } }, body: changes }))

export const reorderStagesRequest = (service: Uuid, stageIds: Uuid[]) =>
  dataOf(
    api.PUT("/services/{id}/stages/order", {
      params: { path: { id: service } },
      body: { stageIds },
    })
  )
