import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"
import { STAGES_KEY, SERVICES_KEY } from "@/lib/api/query-keys"

export type Stage = Schemas["StageResponse"]

export const stageQuery = (id: Uuid) => ({
  queryKey: [...STAGES_KEY, "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/stages/{id}", { params: { path: { id } }, signal })),
})

export type StageFields = { name: string; description: string | null }

export const addStageRequest = (service: Uuid, fields: StageFields) =>
  dataOf(api.POST("/services/{id}/stages", { params: { path: { id: service } }, body: fields }))

export const updateStageRequest = (stage: Uuid, fields: StageFields) =>
  dataOf(api.PUT("/stages/{id}", { params: { path: { id: stage } }, body: fields }))

export const reorderStagesRequest = (service: Uuid, stageIds: Uuid[]) =>
  dataOf(
    api.PUT("/services/{id}/stages/order", {
      params: { path: { id: service } },
      body: { stageIds },
    })
  )

export const STAGE_QUERIES = [STAGES_KEY, SERVICES_KEY]
