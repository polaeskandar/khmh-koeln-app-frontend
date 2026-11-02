"use client"

import { cn } from "cn"
import { CirclePause, MapPin, Repeat, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { ServiceSwatch } from "@/components/service-tag"
import { StatusBadge } from "@/components/status"
import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import { groupOf, type ScheduleSummary } from "@/lib/api/types/meetings"
import { recurrenceOf } from "@/lib/domain/recurrence"

function NextLabel({ schedule, today }: { schedule: ScheduleSummary; today: LocalDate }) {
  const t = useTranslations("meetings.list")
  const f = useFormat()
  const [next] = schedule.nextDates

  if (!next) {
    return <>{t("noUpcoming")}</>
  }

  if (next.status === "active") {
    return <>{t("nowOpen")}</>
  }

  return <>{t("next", { when: f.relativeDay(next.date, today), time: next.startTime })}</>
}

export function ScheduleList({
  schedules,
  today,
  showService = true,
  emptyText,
  trailing,
}: {
  schedules: ScheduleSummary[]
  today: LocalDate
  showService?: boolean
  emptyText: string
  trailing?: (schedule: ScheduleSummary) => React.ReactNode
}) {
  const t = useTranslations("meetings")
  const f = useFormat()

  if (schedules.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <ul className="divide-y border-y">
      {schedules.map((schedule) => (
        <li key={schedule.id} className="flex min-w-0 items-center gap-3">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-1.5 py-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,170px)]">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex min-w-0 items-center gap-2">
                {showService ? <ServiceSwatch tone={schedule.service.tone} /> : null}
                <span
                  className={cn(
                    "truncate font-medium",
                    !schedule.active && "text-muted-foreground"
                  )}
                >
                  {groupOf(schedule)}
                </span>
                <span dir="auto" className="truncate text-sm text-muted-foreground">
                  · {schedule.name}
                </span>
              </span>
              {showService && schedule.stage ? (
                <span className="truncate text-xs text-muted-foreground">
                  {schedule.service.name}
                </span>
              ) : null}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5 text-sm">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Repeat className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">
                  {f.recurrence(recurrenceOf(schedule.recurrence))} ·{" "}
                  {f.timeRange(schedule.startTime, schedule.endTime)}
                </span>
              </span>
              <span className="inline-flex min-w-0 flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                {schedule.location ? (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="size-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{schedule.location}</span>
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <UsersRound className="size-3 shrink-0" aria-hidden="true" />
                  {schedule.rosterMode === "open"
                    ? t("roster.open")
                    : t("roster.ofGroup", { group: groupOf(schedule) })}
                </span>
              </span>
            </span>
            <span className="flex flex-col items-start gap-1 text-sm md:items-end">
              {schedule.active ? (
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums md:justify-end">
                  <NextLabel schedule={schedule} today={today} />
                </span>
              ) : (
                <StatusBadge tone="muted" icon={CirclePause}>
                  {t("list.inactive")}
                </StatusBadge>
              )}
              <span className="text-xs text-muted-foreground">
                {t("list.sessionsSoFar", { count: schedule.sessionCount })}
              </span>
            </span>
          </div>
          {trailing ? <div className="shrink-0">{trailing(schedule)}</div> : null}
        </li>
      ))}
    </ul>
  )
}
