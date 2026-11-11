"use client"

import { cn } from "@/lib/utils"
import {
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  CircleDashed,
  TriangleAlert,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import type { MeetingView } from "./api"
import { isolate } from "@/lib/bidi"

export function MeetingLine({
  meeting,
  today,
  className,
}: {
  meeting: MeetingView
  today: LocalDate
  className?: string
}) {
  const t = useTranslations("lessons")
  const f = useFormat()
  const base = "inline-flex items-start gap-1.5 text-sm"

  switch (meeting.kind) {
    case "none":
      return (
        <span className={cn(base, "text-muted-foreground", className)}>
          <CircleDashed className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {t("meeting.none", { date: f.relativeDay(meeting.date, today) })}
        </span>
      )
    case "planned":
      return (
        <span className={cn(base, "text-muted-foreground", className)}>
          <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {[
            t("meeting.when", {
              title: isolate(meeting.title),
              date: f.relativeDayInline(meeting.date, today),
              time: meeting.startTime,
            }),
            t("meeting.createdOn", { date: f.dayMonth(meeting.createdOn) }),
          ].join(" · ")}
        </span>
      )
    case "not-on-schedule":
      return (
        <span role="alert" className={cn(base, "text-warning", className)}>
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {t("meeting.notOnSchedule", {
            name: meeting.title ? isolate(meeting.title) : t("theSchedule"),
            date: f.dayMonth(meeting.date),
          })}
        </span>
      )
    case "session":
      if (meeting.status === "canceled") {
        const date = f.dayMonth(meeting.date)

        return (
          <span className={cn(base, "text-destructive", className)}>
            <CalendarX2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {meeting.cancelReason
                ? t.rich("meeting.canceledReason", {
                    date,
                    reason: meeting.cancelReason,
                    bdi: (chunks) => <bdi>{chunks}</bdi>,
                  })
                : t("meeting.canceled", { date })}
            </span>
          </span>
        )
      }

      return (
        <span className={cn(base, "text-muted-foreground", className)}>
          <CalendarCheck2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {[
            t("meeting.when", {
              title: isolate(meeting.title),
              date: f.relativeDayInline(meeting.date, today),
              time: f.timeRange(meeting.startTime, meeting.endTime),
            }),
            meeting.location ? isolate(meeting.location) : null,
            meeting.status === "active"
              ? t("meeting.attendanceOpen")
              : meeting.status === "completed"
                ? t("meeting.held")
                : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      )
  }
}
