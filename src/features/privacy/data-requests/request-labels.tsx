"use client"

import { cn } from "@/lib/utils"
import { Ban, CheckCheck, CircleAlert, Clock, Hourglass, Undo2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { StatusBadge } from "@/components/status"
import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import { daysBetween } from "@/lib/domain/time"

import type { DataRequestRow } from "./api"

const SOON_DAYS = 7

export function useSubjectLabel() {
  const t = useTranslations("privacy.subject")

  return (request: Pick<DataRequestRow, "subjectName" | "erasedSubject">) => {
    if (request.subjectName) {
      return request.subjectName
    }

    const erased = request.erasedSubject

    if (erased?.kind === "member") {
      return erased.group ? t("erasedMemberOf", { group: erased.group }) : t("erasedMember")
    }

    return t("erasedAccount")
  }
}

const DUE_TONES = {
  late: { className: "font-medium text-destructive", icon: CircleAlert },
  soon: { className: "font-medium text-warning", icon: Clock },
  quiet: { className: "", icon: null },
} as const

function dueToneOf(left: number): keyof typeof DUE_TONES {
  if (left < 0) {
    return "late"
  }

  return left <= SOON_DAYS ? "soon" : "quiet"
}

export function DueLabel({ dueOn, today }: { dueOn: LocalDate; today: LocalDate }) {
  const t = useTranslations("privacy.due")
  const f = useFormat()
  const left = daysBetween(today, dueOn)
  const tone = dueToneOf(left)
  const { className, icon: Icon } = DUE_TONES[tone]

  const leftText = () => {
    if (tone === "late") {
      return t("late", { count: -left })
    }

    return left === 0 ? t("today") : t("left", { count: left })
  }

  return (
    <span data-tone={tone} className={cn("inline-flex items-center gap-1.5", className)}>
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden="true" /> : null}
      <span>
        {f.dayMonth(dueOn)}
        <span className={cn("ms-1.5", tone === "quiet" && "text-muted-foreground")}>
          {leftText()}
        </span>
      </span>
    </span>
  )
}

const STATUS_BADGES = {
  open: { tone: "info", icon: Hourglass },
  done: { tone: "success", icon: CheckCheck },
  declined: { tone: "neutral", icon: Ban },
  withdrawn: { tone: "muted", icon: Undo2 },
} as const

export function RequestStatusBadge({ status }: { status: DataRequestRow["status"] }) {
  const t = useTranslations("privacy.status")
  const { tone, icon } = STATUS_BADGES[status]

  return (
    <StatusBadge tone={tone} icon={icon}>
      {t(status)}
    </StatusBadge>
  )
}
