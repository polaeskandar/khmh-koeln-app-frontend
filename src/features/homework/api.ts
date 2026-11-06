import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

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
