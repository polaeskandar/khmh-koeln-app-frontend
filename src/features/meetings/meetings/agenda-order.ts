import type { LocalDate, LocalTime } from "@/lib/api/types/common"

import { groupOf, type Placed } from "./session-lines"

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
