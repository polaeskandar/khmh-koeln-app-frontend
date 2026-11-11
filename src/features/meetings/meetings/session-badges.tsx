"use client"

import { Ban, CalendarClock, CheckCheck, CircleDashed, Sparkle } from "lucide-react"
import { useTranslations } from "next-intl"

import { StatusBadge } from "@/components/status"
import type { PlannedItem, SessionItem, SessionStatus } from "@/lib/api/types/meetings"

type Badged = Pick<PlannedItem, "kind"> | Pick<SessionItem, "kind" | "status" | "scheduleId">

export function SessionStatusBadge({
  status,
  className,
  title,
}: {
  status: SessionStatus | "planned"
  className?: string
  title?: string
}) {
  const t = useTranslations("status")
  const props = { className, title }

  switch (status) {
    case "active":
      return (
        <StatusBadge tone="success" variant="live" {...props}>
          {t("active")}
        </StatusBadge>
      )
    case "scheduled":
      return (
        <StatusBadge tone="muted" icon={CalendarClock} {...props}>
          {t("scheduled")}
        </StatusBadge>
      )
    case "completed":
      return (
        <StatusBadge tone="neutral" icon={CheckCheck} {...props}>
          {t("completed")}
        </StatusBadge>
      )
    case "canceled":
      return (
        <StatusBadge tone="danger" icon={Ban} {...props}>
          {t("canceled")}
        </StatusBadge>
      )
    case "planned":
      return (
        <StatusBadge tone="muted" icon={CircleDashed} variant="dashed" {...props}>
          {t("planned")}
        </StatusBadge>
      )
  }
}

export function OneOffBadge({ className }: { className?: string }) {
  const t = useTranslations("status")

  return (
    <StatusBadge tone="muted" icon={Sparkle} className={className}>
      {t("oneOff")}
    </StatusBadge>
  )
}

export function SessionBadges({ item }: { item: Badged }) {
  if (item.kind === "planned") {
    return <SessionStatusBadge status="planned" />
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <SessionStatusBadge status={item.status} />
      {item.scheduleId === null ? <OneOffBadge /> : null}
    </span>
  )
}
