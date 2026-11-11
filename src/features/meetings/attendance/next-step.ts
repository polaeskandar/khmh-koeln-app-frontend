import type { SessionView } from "@/features/meetings/meetings/api"
import type { LocalDate } from "@/lib/api/types/common"
import type { Can } from "@/lib/permissions"

type AttendanceStep = "take" | "open" | "view"

type DatedSession = Pick<SessionView, "status" | "date">

export function isDue(session: DatedSession, today: LocalDate): boolean {
  return session.status === "scheduled" && session.date <= today
}

export function attendanceStepOf(
  session: DatedSession,
  today: LocalDate,
  can: Can
): AttendanceStep | null {
  const records = can("create", "attendance")

  if (session.status === "active" && records) {
    return "take"
  }

  if (isDue(session, today) && records) {
    return "open"
  }

  if (session.status === "completed" && can("read", "attendance")) {
    return "view"
  }

  return null
}
