import type { Schemas } from "@/lib/api/client"
export type Uuid = string
export type LocalDate = string
export type LocalTime = string
export type Instant = string

export const ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
export type IsoWeekday = (typeof ISO_WEEKDAYS)[number]
export type MonthWeek = 1 | 2 | 3 | 4 | -1
export type Frequency = Schemas["Frequency"]

export type Recurrence = {
  frequency: Frequency
  interval: number
  weekdays: IsoWeekday[]
  monthWeek: MonthWeek | null
  startsOn: LocalDate
  endsOn: LocalDate | null
}

export type ServiceRef = Schemas["ServiceRef"]
export type StageRef = Schemas["StageRef"]
export type AccountRef = Schemas["AccountRef"] | null
export type PersonRef = Schemas["PersonRef"]
export type LessonRef = Schemas["LessonRef"]
export type Counts = Schemas["SessionCounts"]
