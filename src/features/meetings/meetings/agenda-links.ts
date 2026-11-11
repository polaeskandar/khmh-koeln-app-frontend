import type { PlannedItem, SessionItem } from "@/lib/api/types/meetings"
import { routes } from "@/lib/routes"

type Linked = Pick<PlannedItem, "kind" | "scheduleId"> | Pick<SessionItem, "kind" | "id" | "status">

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
