import type { Schemas } from "@/lib/api/client"
export type Uuid = string
export type LocalDate = string
export type LocalTime = string
export type Instant = string

export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type MonthWeek = 1 | 2 | 3 | 4 | -1
export type Frequency = Schemas["Frequency"]

export type Recurrence = {
  frequency: Frequency
  interval: number
  weekdays: IsoWeekday[]
  monthWeek: MonthWeek | null
  span: { startsOn: LocalDate; endsOn: LocalDate | null }
}

export type ServiceRef = Schemas["ServiceReference"]
export type StageRef = Schemas["StageReference"]
export type PersonRef = Schemas["PersonReference"]
export type LessonRef = Schemas["LessonOnDate"]
export type Counts = Schemas["AttendanceCounts"]
