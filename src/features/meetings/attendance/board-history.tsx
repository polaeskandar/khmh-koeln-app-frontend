"use client"

import { useTranslations } from "next-intl"

import { useFormat } from "@/i18n/format"
import { isolate } from "@/lib/bidi"
import { preferredName } from "@/lib/domain/names"

import type { AttendanceSheet as Board } from "./api"

export function RecentlyMarked({ board, onCorrect }: { board: Board; onCorrect?: () => void }) {
  const t = useTranslations("attendance.board")
  const f = useFormat()

  if (board.recentlyMarked.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-2" aria-label={t("recent")}>
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("recent")}
      </h2>
      <ul className="flex flex-col gap-1.5 text-sm">
        {board.recentlyMarked
          .flatMap(({ person, mark }) => (mark ? [{ person, mark }] : []))
          .slice(0, 6)
          .map(({ person, mark }) => (
            <li key={mark.id} className="flex items-center justify-between gap-3">
              <span className="truncate">{preferredName(person)}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {f.instantTime(mark.recordedAt)}
              </span>
            </li>
          ))}
      </ul>
      {onCorrect ? (
        <button
          type="button"
          className="self-start text-xs text-muted-foreground underline underline-offset-4"
          onClick={onCorrect}
        >
          {t("correctMistake")}
        </button>
      ) : null}
    </section>
  )
}

export function Corrections({ board }: { board: Board }) {
  const t = useTranslations("attendance.board")
  const f = useFormat()

  if (board.corrections.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-2" aria-label={t("corrections")}>
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("corrections")}
      </h2>
      <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {board.corrections
          .slice(-4)
          .reverse()
          .map((correction) => {
            if (!correction.removed.at) {
              return null
            }

            const removal = {
              name: preferredName(correction.person),
              when: f.atLabel(correction.removed.at, board.today),
            }

            return (
              <li key={correction.id}>
                {correction.reason
                  ? t("removedReason", { ...removal, reason: isolate(correction.reason) })
                  : t("removed", removal)}
              </li>
            )
          })}
      </ul>
    </section>
  )
}
