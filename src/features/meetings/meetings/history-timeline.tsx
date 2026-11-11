"use client"

import type { LucideIcon } from "lucide-react"
import { Ban, CalendarPlus, CheckCheck, LockOpen, PencilLine, RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"

import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import type { HistoryEntry } from "./api"

const ICON: Record<HistoryEntry["type"], LucideIcon> = {
  created: CalendarPlus,
  opened: LockOpen,
  closed: CheckCheck,
  reopened: RotateCcw,
  canceled: Ban,
  edited: PencilLine,
}

export function HistoryTimeline({
  entries,
  today,
  oneOff = false,
}: {
  entries: HistoryEntry[]
  today: LocalDate
  oneOff?: boolean
}) {
  const t = useTranslations()
  const f = useFormat()

  const detailOf = (e: HistoryEntry) => {
    if (e.type === "created" && e.byGenerator) {
      return t("history.createdFromSchedule")
    }

    if (e.type === "created" && oneOff) {
      return t("history.createdByHand")
    }

    return null
  }

  const actorOf = (e: HistoryEntry) =>
    e.actor ? e.actor.name : e.byGenerator ? null : t("common.formerAccount")

  return (
    <ol className="relative flex flex-col gap-5 ps-1">
      <span className="absolute start-[15px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />
      {entries.map((e, i) => {
        const Icon = ICON[e.type]
        const detail = detailOf(e)
        const actor = actorOf(e)

        return (
          <li key={`${e.type}-${e.at}-${i}`} className="relative flex gap-3">
            <span className="relative z-10 flex size-7 shrink-0 items-center justify-center border bg-background text-muted-foreground">
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
              <span className="text-sm font-medium">{t(`history.${e.type}`)}</span>
              <span className="text-xs text-muted-foreground">
                {f.instantLabel(e.at, today)}
                {actor ? ` · ${actor}` : null}
              </span>
              {detail ? (
                <span className="text-sm text-pretty text-muted-foreground">{detail}</span>
              ) : null}
              {e.note ? (
                <span dir="auto" className="text-sm text-pretty text-muted-foreground">
                  {e.note}
                </span>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
