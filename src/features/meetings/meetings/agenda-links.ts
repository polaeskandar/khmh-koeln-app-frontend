import { routes } from "@/lib/routes"

import type { PlannedSession, AgendaSession } from "./api"

type Linked =
  Pick<PlannedSession, "kind" | "scheduleId"> | Pick<AgendaSession, "kind" | "id" | "status">

export function agendaHref(item: Linked): string | undefined {
  if (item.kind === "planned") {
    return routes.schedule(item.scheduleId)
  }

  if (item.status === "active") {
    return routes.takeAttendance(item.id)
  }

  if (item.status === "completed") {
    return routes.attendanceSummary(item.id)
  }

  return routes.session(item.id)
}
