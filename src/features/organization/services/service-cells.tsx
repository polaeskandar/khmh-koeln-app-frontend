"use client"

import { useTranslations } from "next-intl"

import { useNow } from "@/hooks/use-today"
import { useFormat } from "@/i18n/format"

import { type Service, type Trend, useServiceInsight, useServiceInsights } from "./api"

const DASH = "—"

const NEXT_STATUSES = ["scheduled", "active", "planned"] as const

type NextStatus = (typeof NEXT_STATUSES)[number]

const isNextStatus = (status: string): status is NextStatus =>
  NEXT_STATUSES.some((known) => known === status)

export function NextMeetingCell({ service }: { service: Service }) {
  const t = useTranslations()
  const f = useFormat()
  const now = useNow()
  const insight = useServiceInsight(service.id)

  if (service.archived) {
    return <span className="text-muted-foreground">{DASH}</span>
  }

  const next = insight?.next

  if (!next) {
    return <span className="text-muted-foreground">{t("services.nothingPlanned")}</span>
  }

  const status = isNextStatus(next.status) ? t(`status.${next.status}`) : null

  return (
    <span className="flex flex-col gap-0.5">
      <span className="tabular-nums">
        {t("services.table.when", {
          day: now ? f.relativeDay(next.date, now.date) : f.dayMonth(next.date),
          time: next.startTime,
        })}
      </span>
      <span className="text-xs text-muted-foreground">
        {next.stage ? <bdi>{next.stage.name}</bdi> : status}
      </span>
    </span>
  )
}

export function useNextAt() {
  const t = useTranslations("services.table")
  const f = useFormat()
  const today = useNow()?.date ?? null
  const insights = useServiceInsights()

  return (service: Service): string | null => {
    const next = insights.get(service.id)?.next

    if (service.archived || !next) {
      return null
    }

    const { date, startTime } = next

    return t("nextAt", {
      when: today ? f.relativeDayInline(date, today) : f.dayMonth(date),
      time: startTime,
    })
  }
}

export function AttendanceCell({ service }: { service: Service }) {
  const t = useTranslations("services.table")
  const f = useFormat()
  const trend = useServiceInsight(service.id)?.trend

  if (!trend) {
    return <span className="text-muted-foreground">{DASH}</span>
  }

  if (trend.rate !== null) {
    return (
      <span className="flex min-w-24 flex-col gap-1">
        <span className="tabular-nums">{f.percent(trend.rate)}</span>
        <span className="h-1 w-full bg-muted" aria-hidden="true">
          <span
            className="block h-full bg-primary"
            style={{ width: `${Math.round(trend.rate * 100)}%` }}
          />
        </span>
      </span>
    )
  }

  if (trend.averagePresent !== null) {
    return (
      <span className="tabular-nums">
        {t.rich("onAverage", {
          count: trend.averagePresent,
          muted: (chunks) => <span className="text-muted-foreground">{chunks}</span>,
        })}
      </span>
    )
  }

  if (trend.sessions === 0) {
    return <span className="text-muted-foreground">{t("noSessions")}</span>
  }

  return <span className="text-muted-foreground">{DASH}</span>
}

export function trendText(trend: Trend | undefined, f: ReturnType<typeof useFormat>): string {
  if (trend?.rate != null) {
    return f.percent(trend.rate)
  }

  if (trend?.averagePresent != null) {
    return String(trend.averagePresent)
  }

  return DASH
}
