"use client"

import { Archive, CheckCheck, CircleCheck, PencilLine } from "lucide-react"
import { useTranslations } from "next-intl"

import { StatusBadge } from "@/components/status"

import type { LessonStatus } from "./api"

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
