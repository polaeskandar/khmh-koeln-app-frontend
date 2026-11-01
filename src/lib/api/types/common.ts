export type Id = string

export type ServiceRef = { id: Id; name: string; tone: number; archived: boolean }

export type StageRef = { id: Id; name: string; position: number; archived: boolean }

export type AccountRef = { id: Id; name: string } | null

export type PersonRef = { id: Id; firstName: string; lastName: string; displayName: string | null }

export type LessonRef = { id: Id; title: string; teachingDate: string }

export type Counts = {
  present: number
  rosterSize: number | null
  rosterPresent: number
  notMarked: number
  notOnRoster: number
}
