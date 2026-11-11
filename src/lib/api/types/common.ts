import type { Schemas } from "@/lib/api/client"
export type Uuid = string
export type LocalDate = string
export type LocalTime = string
export type Instant = string

export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type MonthWeek = 1 | 2 | 3 | 4 | -1

export type Recurrence = {
  frequency: Schemas["Frequency"]
  interval: number
  weekdays: IsoWeekday[]
  monthWeek: MonthWeek | null
  span: { startsOn: LocalDate; endsOn: LocalDate | null }
}
