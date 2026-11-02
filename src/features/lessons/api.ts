import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { LocalDate, Uuid } from "@/lib/api/types/common"

export type Material = { label: string; url: string | null }

export type HomeworkCounts = { total: number; published: number; drafts: number }

export type LessonRow = Schemas["LessonRow"]
export type Lesson = Schemas["LessonView"]
export type LessonDetail = Schemas["LessonDetail"]

export type LessonTab = "upcoming" | "previous" | "archived"

export type StageLessons = Schemas["LessonList"]

export const lessonQuery = (id: Uuid) => ({
  queryKey: ["lessons", "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/lessons/{id}", { params: { path: { id } }, signal })),
})

export const useLesson = (id: Uuid) => useQuery(lessonQuery(id))

export const stageLessonsQuery = (stage: Uuid, tab: LessonTab = "upcoming", q = "") => ({
  queryKey: ["lessons", "list", { stage, tab, q }] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(
      api.GET("/stages/{stageId}/lessons", {
        params: { path: { stageId: stage }, query: { tab, ...(q ? { q } : {}) } },
        signal,
      })
    ),
})

export type LessonInput = {
  title: string
  teachingDate?: LocalDate
  scheduleId?: Uuid | null
  sessionId?: Uuid | null
  summary: string | null
  passage: string | null
  memoryVerse: string | null
  objectives: string | null
  teachingPoints: string | null
  activities: string | null
  materials: Material[]
  notes?: string | null
  responsibleId?: Uuid
  status?: "draft" | "ready"
}

export const createLessonRequest = (stage: Uuid, input: LessonInput) =>
  dataOf(
    api.POST("/stages/{stageId}/lessons", { params: { path: { stageId: stage } }, body: input })
  )

export const updateLessonRequest = (lesson: Uuid, input: LessonInput) =>
  dataOf(api.PATCH("/lessons/{id}", { params: { path: { id: lesson } }, body: input }))
