"use client"

import { cn } from "cn"
import { CalendarDays } from "lucide-react"
import { useTranslations } from "next-intl"

import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import { daysBetween } from "@/lib/domain/time"
import type { Format } from "@/lib/format"

type HomeworkT = ReturnType<typeof useTranslations<"homework">>

export function dueLabel(
  t: HomeworkT,
  f: Format,
  dueDate: LocalDate | null,
  today: LocalDate
): string {
  if (!dueDate) {
    return t("due.none")
  }

  const days = daysBetween(today, dueDate)

  if (days === 0) {
    return t("due.today")
  }

  if (days === 1) {
    return t("due.tomorrow")
  }

  if (days > 1 && days < 7) {
    return t("due.inDays", { weekday: f.weekdayShort(dueDate), count: days })
  }

  if (days === -1) {
    return t("due.yesterday")
  }

  if (days < 0) {
    return t("due.past", { date: f.dayMonth(dueDate) })
  }

  return t("due.on", { date: f.dayMonth(dueDate) })
}

export function useDueLabel() {
  const t = useTranslations("homework")
  const f = useFormat()

  return (dueDate: LocalDate | null, today: LocalDate) => dueLabel(t, f, dueDate, today)
}

export function DueLine({
  dueDate,
  today,
  className,
}: {
  dueDate: LocalDate | null
  today: LocalDate
  className?: string
}) {
  const due = useDueLabel()

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}
    >
      <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
      {due(dueDate, today)}
    </span>
  )
}
