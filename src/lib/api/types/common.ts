export type Uuid = string
export type LocalDate = string
export type LocalTime = string
export type Instant = string

export const ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
export type IsoWeekday = (typeof ISO_WEEKDAYS)[number]
export type MonthWeek = 1 | 2 | 3 | 4 | -1
export type Frequency = "weekly" | "monthly"

export type Recurrence = {
  frequency: Frequency
  interval: number
  weekdays: IsoWeekday[]
  monthWeek: MonthWeek | null
  startsOn: LocalDate
  endsOn: LocalDate | null
}

export type ServiceRef = { id: Uuid; name: string; tone: number; archived: boolean }

export type StageRef = { id: Uuid; name: string; position: number; archived: boolean }

export type AccountRef = { id: Uuid; name: string } | null

export type PersonRef = {
  id: Uuid
  firstName: string
  lastName: string
  displayName: string | null
}

export type LessonRef = { id: Uuid; title: string; teachingDate: LocalDate }

export type Counts = {
  present: number
  rosterSize: number | null
  rosterPresent: number
  notMarked: number
  notOnRoster: number
}
