"use client"

import { Archive, Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"

import { StatusBadge } from "@/components/status"
import type { HomeworkStatus } from "@/lib/api/types/learning"

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
