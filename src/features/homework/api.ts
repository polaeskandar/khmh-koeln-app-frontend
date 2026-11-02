import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Instant, LessonRef, LocalDate, Uuid } from "@/lib/api/types/common"
import type { HomeworkStatus } from "@/lib/api/types/learning"

export type HomeworkCounts = { completed: number; assigned: number; withoutAccount: number }

export type HomeworkRow = {
  id: Uuid
  title: string
  status: HomeworkStatus
  dueDate: LocalDate | null
  publishedAt: Instant | null
  lesson: LessonRef
  counts: HomeworkCounts | null
  can: {
    edit: boolean
    publish: boolean
    unpublish: boolean
    archive: boolean
    restore: boolean
    delete: boolean
  }
}

export type StageHomework = Schemas["HomeworkList"]

export const stageHomeworkQuery = (stage: Uuid) => ({
  queryKey: ["homework", "list", { stage }] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/stages/{stageId}/homework", { params: { path: { stageId: stage } }, signal })),
})

export const useStageHomework = (stage: Uuid) => useQuery(stageHomeworkQuery(stage))
