import type { LocalDate, LocalTime, ServiceRef } from "@/lib/api/types/common"
import { type AgendaItem, groupOf } from "@/lib/api/types/meetings"

export type UpcomingEntry =
  | { kind: "single"; item: AgendaItem }
  | {
      kind: "group"
      date: LocalDate
      startTime: LocalTime
      service: ServiceRef
      title: string
      planned: boolean
      groups: string[]
    }

const mergeable = (item: AgendaItem) => item.kind === "planned" || item.status === "scheduled"

const keyOf = (item: AgendaItem) =>
  [item.kind, item.date, item.startTime, item.service.id, item.title].join("|")

export function groupUpcoming(items: AgendaItem[]): UpcomingEntry[] {
  const entries: UpcomingEntry[] = []
  const groups = new Map<string, AgendaItem[]>()

  for (const item of items) {
    if (!mergeable(item)) {
      entries.push({ kind: "single", item })

      continue
    }

    const key = keyOf(item)
    const same = groups.get(key)

    if (same) {
      same.push(item)

      continue
    }

    const members = [item]
    groups.set(key, members)
    entries.push({ kind: "single", item })
  }

  return entries.map((entry) => {
    if (entry.kind !== "single" || !mergeable(entry.item)) {
      return entry
    }

    const members = groups.get(keyOf(entry.item))!

    if (members.length === 1) {
      return entry
    }

    const first = members[0]!

    return {
      kind: "group",
      date: first.date,
      startTime: first.startTime,
      service: first.service,
      title: first.title,
      planned: first.kind === "planned",
      groups: members.map(groupOf),
    }
  })
}
