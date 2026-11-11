import type { Schemas } from "@/lib/api/client"
import type { Counts } from "./common"

export type SessionStatus = Schemas["SessionStatus"]
export type RosterMode = Schemas["RosterMode"]
export type SessionView = Schemas["SessionResponse"] & { counts?: Counts | null }
export type SessionItem = Schemas["AgendaSessionResponse"]
export type CountedSession = Omit<SessionItem, "kind">
export type PlannedItem = Schemas["PlannedSessionResponse"]
export type AgendaItem = Schemas["AgendaResponse"]["items"][number]
export type ScheduleSummary = Schemas["ScheduleResponse"]
export type HistoryEntry = Schemas["HistoryEntry"]
