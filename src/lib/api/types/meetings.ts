import type { Schemas } from "@/lib/api/client"
import type { Counts, LocalDate, LocalTime, ServiceRef, StageRef } from "./common"

export type SessionStatus = Schemas["SessionStatus"]
export type RosterMode = Schemas["RosterMode"]
export type SessionView = Schemas["SessionResponse"] & { counts?: Counts | null }
export type SessionItem = Schemas["AgendaSessionResponse"]
export type CountedSession = Omit<SessionItem, "kind">
export type PlannedItem = Schemas["PlannedSessionResponse"]
export type AgendaItem = Schemas["AgendaResponse"]["items"][number]
export type ScheduleSummary = Schemas["ScheduleResponse"]
export type HistoryEntry = Schemas["HistoryEntry"]

type Placed = { service: ServiceRef | null; stage: StageRef | null }

export const groupOf = (item: Placed) => item.stage?.name ?? item.service?.name ?? ""

export const orderOf = (item: Placed) => item.stage?.position ?? -1

type Sortable = Placed & { date: LocalDate; startTime: LocalTime }

export function compareAgenda(a: Sortable, b: Sortable): number {
  return (
    `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`) ||
    (a.service?.name ?? "").localeCompare(b.service?.name ?? "", "de") ||
    orderOf(a) - orderOf(b) ||
    groupOf(a).localeCompare(groupOf(b), "de")
  )
}
