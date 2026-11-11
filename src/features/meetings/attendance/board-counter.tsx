"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

import { RosterCells } from "./roster-cells"
import type { AttendanceSheet } from "./api"
import type { BoardActions } from "./person-row"

export function tallyOf(sheet: AttendanceSheet) {
  const rosterSize = sheet.roster.length

  return {
    expected: sheet.session.rosterMode === "expected",
    rosterSize,
    notMarked: rosterSize - sheet.counts.rosterPresent,
  }
}

const num = (chunks: ReactNode) => (
  <span className="font-heading text-3xl font-semibold text-foreground tabular-nums">{chunks}</span>
)

function BoardCounter({ sheet }: { sheet: AttendanceSheet }) {
  const t = useTranslations("attendance.board")
  const { counts } = sheet
  const { expected, rosterSize } = tallyOf(sheet)

  return (
    <span className="text-sm text-muted-foreground">
      {expected
        ? t.rich("counter", { present: counts.rosterPresent, total: rosterSize, num })
        : t.rich("counterOpen", { count: counts.present, num })}
      {expected && counts.notOnRoster
        ? ` · ${t("notOnRoster", { count: counts.notOnRoster })}`
        : null}
    </span>
  )
}

export function CounterPanel({
  sheet,
  canRecord,
  actions,
}: {
  sheet: AttendanceSheet
  canRecord: boolean
  actions: BoardActions
}) {
  const t = useTranslations("attendance.board")
  const { counts } = sheet
  const { expected, rosterSize, notMarked } = tallyOf(sheet)

  return (
    <div className="flex flex-col gap-3 border p-5" data-testid="counter-panel">
      <p>
        <BoardCounter sheet={sheet} />
      </p>
      {expected && rosterSize > 0 ? (
        <RosterCells
          filled={counts.rosterPresent}
          total={rosterSize}
          extra={counts.notOnRoster}
          size="md"
        />
      ) : null}
      {expected ? (
        <p className="text-sm text-muted-foreground">
          {notMarked === 0 ? t("everyoneMarked") : t("notMarkedYet", { count: notMarked })}
        </p>
      ) : null}
      {canRecord ? (
        <>
          <Button onClick={actions.onClose} disabled={!actions.onClose || actions.saving}>
            {t("close")}
          </Button>
          {actions.saving ? (
            <p role="status" className="text-xs text-muted-foreground">
              {t("saving")}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{t("viewOnly")}</p>
      )}
    </div>
  )
}

export function MobileCounterBar({
  sheet,
  canRecord,
  actions,
}: {
  sheet: AttendanceSheet
  canRecord: boolean
  actions: BoardActions
}) {
  const t = useTranslations("attendance.board")

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <p className="flex-1 leading-tight">
        <BoardCounter sheet={sheet} />
      </p>
      {canRecord ? (
        <Button onClick={actions.onClose} disabled={!actions.onClose || actions.saving}>
          {t("closeShort")}
        </Button>
      ) : null}
    </div>
  )
}
