"use client"

import { cn } from "cn"
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

export function DueLabel({ dueOn, today }: { dueOn: LocalDate; today: LocalDate }) {
  const t = useTranslations("privacy.due")
  const f = useFormat()
  const left = daysBetween(today, dueOn)
  const late = left < 0
  const soon = !late && left <= SOON_DAYS

  return (
    <span
      data-tone={late ? "late" : soon ? "soon" : "quiet"}
      className={cn(
        "inline-flex items-center gap-1.5",
        late ? "font-medium text-destructive" : soon ? "font-medium text-warning" : ""
      )}
    >
      {late ? (
        <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      ) : soon ? (
        <Clock className="size-3.5 shrink-0" aria-hidden="true" />
      ) : null}
      <span>
        {f.dayMonth(dueOn)}
        <span className={cn("ms-1.5", !late && !soon && "text-muted-foreground")}>
          {late
            ? t("late", { count: -left })
            : left === 0
              ? t("today")
              : t("left", { count: left })}
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
