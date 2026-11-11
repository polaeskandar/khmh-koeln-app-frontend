import { queryOptions } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"
import { STAGES_KEY, SERVICES_KEY } from "@/lib/api/query-keys"

export type StageReference = Schemas["StageReference"]

export type Stage = Schemas["StageResponse"]

export const stageQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...STAGES_KEY, "detail", id],
    queryFn: ({ signal }) => dataOf(api.GET("/stages/{id}", { params: { path: { id } }, signal })),
  })

export type StageRequest = Schemas["StageRequest"]

export const addStageRequest = (serviceId: Uuid, fields: StageRequest) =>
  dataOf(api.POST("/services/{id}/stages", { params: { path: { id: serviceId } }, body: fields }))

export const updateStageRequest = (stageId: Uuid, fields: StageRequest) =>
  dataOf(api.PUT("/stages/{id}", { params: { path: { id: stageId } }, body: fields }))

export const reorderStagesRequest = (serviceId: Uuid, stageIds: Uuid[]) =>
  dataOf(
    api.PUT("/services/{id}/stages/order", {
      params: { path: { id: serviceId } },
      body: { stageIds },
    })
  )

export const archiveStageRequest = (stageId: Uuid) =>
  dataOf(api.POST("/stages/{id}/archive", { params: { path: { id: stageId } }, body: {} }))

export const restoreStageRequest = (stageId: Uuid) =>
  dataOf(api.POST("/stages/{id}/restore", { params: { path: { id: stageId } }, body: {} }))

export const deleteStageRequest = (stageId: Uuid) =>
  dataOf(api.DELETE("/stages/{id}", { params: { path: { id: stageId } } }))

export const STAGE_QUERIES = [STAGES_KEY, SERVICES_KEY]

export const STAGE_ORDER_QUERIES = [SERVICES_KEY]
