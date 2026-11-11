import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { LocalDate, Uuid } from "@/lib/api/types/common"
import type { LessonStatus } from "@/lib/api/types/learning"
import type { Can } from "@/lib/permissions"

export type LessonRow = Schemas["LessonRowResponse"]

export type LessonDetail = Schemas["LessonDetailResponse"]

export type Lesson = LessonDetail["lesson"]

export type LessonStage = LessonDetail["stage"]

export type Material = Lesson["materials"][number]

export type LessonTab = "upcoming" | "previous" | "archived"

export type StageLessons = Schemas["LessonListResponse"]

export const lessonQuery = (id: Uuid) => ({
  queryKey: ["lessons", "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/lessons/{id}", { params: { path: { id } }, signal })),
})

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

export type LessonInput = Schemas["LessonRequest"]

export type MeetingChoice = Schemas["LessonMeetingRequest"]

export const createLessonRequest = (stage: Uuid, input: LessonInput) =>
  dataOf(
    api.POST("/stages/{stageId}/lessons", { params: { path: { stageId: stage } }, body: input })
  )

export const updateLessonRequest = (lesson: Uuid, version: number, input: LessonInput) =>
  dataOf(
    api.PUT("/lessons/{id}", {
      params: { path: { id: lesson }, query: { version } },
      body: input,
    })
  )

export type MeetingOption = Schemas["LessonOptionResponse"]
export type LessonOptions = Schemas["LessonOptionsResponse"]

export const lessonOptionsQuery = (stage: Uuid, lesson?: Uuid) => ({
  queryKey: ["lessons", "options", { stage, lesson }] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(
      api.GET("/stages/{stageId}/lesson-options", {
        params: { path: { stageId: stage }, query: lesson ? { lessonId: lesson } : {} },
        signal,
      })
    ),
})

export const OTHER_DATE = "other"

export const optionValue = (option: Pick<MeetingOption, "scheduleId" | "date">) =>
  `${option.scheduleId}:${option.date}`

export function toMeeting(
  value: string,
  otherDate: LocalDate,
  options: MeetingOption[]
): MeetingChoice {
  const option = options.find((o) => optionValue(o) === value)

  return option ? { scheduleId: option.scheduleId, date: option.date } : { date: otherDate }
}

export const meetingOf = (lesson: Lesson): MeetingChoice =>
  lesson.scheduleId
    ? { scheduleId: lesson.scheduleId, date: lesson.teachingDate }
    : { date: lesson.teachingDate }

export const changeLessonStatusRequest = (lesson: Uuid, status: LessonStatus) =>
  dataOf(api.POST("/lessons/{id}/status", { params: { path: { id: lesson } }, body: { status } }))

export const linesOf = (text: string | null) =>
  (text ?? "")
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)

export const archiveLessonRequest = (id: Uuid) =>
  dataOf(api.POST("/lessons/{id}/archive", { params: { path: { id } }, body: {} }))

export const restoreLessonRequest = (id: Uuid) =>
  dataOf(api.POST("/lessons/{id}/restore", { params: { path: { id } }, body: {} }))

export const deleteLessonRequest = (id: Uuid) =>
  dataOf(api.DELETE("/lessons/{id}", { params: { path: { id } } }))

export type LessonFlags = Record<
  "manage" | "markCompleted" | "addHomework" | "archive" | "restore" | "delete",
  boolean
>

export function lessonFlagsFor(
  can: Can,
  { archived, today, lesson }: LessonDetail,
  everPublished: boolean | null
): LessonFlags {
  const update = can("update", "lessons") && !archived
  const open = !archived && lesson.archivedAt === null
  const manage = update && open

  return {
    manage,
    markCompleted: manage && lesson.status === "ready" && lesson.teachingDate <= today,
    addHomework: can("create", "homework") && open,
    archive: manage,
    restore: update && lesson.archivedAt !== null,
    delete: update && lesson.status === "draft" && everPublished === false,
  }
}
