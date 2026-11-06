import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { LocalDate, Uuid } from "@/lib/api/types/common"

export type HomeworkCounts = Schemas["AudienceCounts"]
export type HomeworkFlags = Schemas["HomeworkItem"]["can"]
export type HomeworkRow = Schemas["HomeworkItem"]
export type StageHomework = Schemas["HomeworkList"]

export const stageHomeworkQuery = (stage: Uuid) => ({
  queryKey: ["homework", "list", { stage }] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/stages/{stageId}/homework", { params: { path: { stageId: stage } }, signal })),
})

export const useStageHomework = (stage: Uuid) => useQuery(stageHomeworkQuery(stage))

export type Resource = { label: string; url: string | null }

export type HomeworkDetail = Schemas["HomeworkDetail"]

export type HomeworkInput = {
  title: string
  instructions: string
  dueDate: LocalDate | null
  resources: Resource[]
}

export type SavedHomework = Schemas["HomeworkWritten"]

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

export const updateHomeworkRequest = (id: Uuid, input: HomeworkInput) =>
  dataOf(api.PATCH("/homework/{id}", { params: { path: { id } }, body: input }))

export type PublishedHomework = Schemas["HomeworkStatusChanged"]

export const publishHomeworkRequest = (id: Uuid) =>
  dataOf(api.POST("/homework/{id}/publish", { params: { path: { id } }, body: {} }))
