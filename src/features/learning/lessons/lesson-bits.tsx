"use client"

import { cn } from "cn"
import {
  Archive,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  CheckCheck,
  CircleCheck,
  CircleDashed,
  Eye,
  EyeOff,
  PencilLine,
  TriangleAlert,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { StatusBadge } from "@/components/status"
import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import type { HomeworkStatus, LessonStatus, MeetingView } from "@/lib/api/types/learning"
import { isolate } from "@/lib/bidi"

export function LessonStatusBadge({
  status,
  archived,
  className,
}: {
  status: LessonStatus
  archived?: boolean
  className?: string
}) {
  const t = useTranslations()

  if (archived) {
    return (
      <StatusBadge tone="muted" icon={Archive} className={className}>
        {t("common.archived")}
      </StatusBadge>
    )
  }

  switch (status) {
    case "draft":
      return (
        <StatusBadge tone="muted" icon={PencilLine} className={className}>
          {t("lessons.status.draft")}
        </StatusBadge>
      )
    case "ready":
      return (
        <StatusBadge tone="info" icon={CircleCheck} className={className}>
          {t("lessons.status.ready")}
        </StatusBadge>
      )
    case "completed":
      return (
        <StatusBadge
          tone="neutral"
          icon={CheckCheck}
          className={className}
          title={t("lessons.status.taught")}
        >
          {t("lessons.status.completed")}
        </StatusBadge>
      )
  }
}

export function HomeworkStatusBadge({
  status,
  className,
}: {
  status: HomeworkStatus
  className?: string
}) {
  const t = useTranslations()

  switch (status) {
    case "draft":
      return (
        <StatusBadge
          tone="muted"
          icon={EyeOff}
          className={className}
          title={t("lessons.status.draftHidden")}
        >
          {t("lessons.status.draft")}
        </StatusBadge>
      )
    case "published":
      return (
        <StatusBadge
          tone="success"
          icon={Eye}
          className={className}
          title={t("lessons.status.publishedVisible")}
        >
          {t("lessons.status.published")}
        </StatusBadge>
      )
    case "archived":
      return (
        <StatusBadge tone="muted" icon={Archive} className={className}>
          {t("common.archived")}
        </StatusBadge>
      )
  }
}

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

export function CompletionMeter({
  completed,
  assigned,
  className,
}: {
  completed: number
  assigned: number
  className?: string
}) {
  const t = useTranslations("lessons")
  const ratio = assigned > 0 ? completed / assigned : 0

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-sm tabular-nums">
        {t.rich("completion", {
          completed,
          assigned,
          strong: (chunks) => <span className="font-medium">{chunks}</span>,
        })}
      </span>
      <span className="h-1 w-full bg-muted" aria-hidden="true">
        <span
          className="block h-full bg-primary"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </span>
    </div>
  )
}
