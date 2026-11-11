"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import { preferredName } from "@/lib/domain/names"
import { routes } from "@/lib/routes"

import { type HistoryCell, stageAttendanceHistoryQuery } from "./api"
import type { Stage } from "@/features/organization/stages/api"
import { StageLayout } from "@/features/organization/stages/stage-layout"

const CELL_TEXT = {
  present: "present",
  notMarked: "notMarked",
  notOnRoster: "notInStage",
} as const

const isHistoryCell = (cell: string): cell is HistoryCell => cell in CELL_TEXT

function Cell({ value }: { value: string }) {
  const t = useTranslations("attendance.stage")
  const cell: HistoryCell = isHistoryCell(value) ? value : "notMarked"

  return (
    <td className="px-1 py-2 text-center">
      <span
        title={t(`cell.${CELL_TEXT[cell]}`)}
        className={cn(
          "inline-block size-3.5 align-middle",
          cell === "present" && "bg-primary",
          cell === "notMarked" && "bg-muted ring-1 ring-foreground/15 ring-inset",
          cell === "notOnRoster" && "h-px w-3.5 bg-foreground/20"
        )}
      />
      <span className="sr-only">{t(`cellSr.${CELL_TEXT[cell]}`)}</span>
    </td>
  )
}

function History({ stage }: { stage: Stage }) {
  const t = useTranslations("attendance.stage")
  const f = useFormat()
  const query = useQuery(stageAttendanceHistoryQuery(stage.id))
  const heading = "h-12 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"

  return (
    <Section id="history" title={t("title")} description={t("description")}>
      <QueryState query={query}>
        {(history) =>
          history.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/40">
                  <tr className="border-b">
                    <th scope="col" className={cn(heading, "text-start")}>
                      {t("member")}
                    </th>
                    {history.sessions.map((session) => (
                      <th key={session.id} scope="col" className="w-16 px-1 text-center">
                        <Link
                          href={routes.attendanceSummary(session.id)}
                          className="flex flex-col items-center leading-tight hover:underline"
                        >
                          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            {f.weekdayShort(session.date)}
                          </span>
                          <span className="text-xs tabular-nums">{f.shortDate(session.date)}</span>
                        </Link>
                      </th>
                    ))}
                    <th scope="col" className={cn(heading, "w-24 text-end")}>
                      {t("present")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.rows.map((row) => (
                    <tr key={row.person.id} className="border-b last:border-b-0 hover:bg-muted/40">
                      <th scope="row" className="px-3 py-2 text-start font-medium">
                        {preferredName(row.person)}
                      </th>
                      {row.cells.map((cell, index) => (
                        <Cell key={history.sessions[index]?.id ?? index} value={cell} />
                      ))}
                      <td className="px-3 py-2 text-end tabular-nums">
                        {t("presentOf", {
                          present: row.presentCount,
                          total: history.sessions.length,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30">
                  <tr className="border-t">
                    <th scope="row" className={cn(heading, "h-auto py-2 text-start")}>
                      {t("present")}
                    </th>
                    {history.sessions.map((session) => (
                      <td key={session.id} className="px-1 py-2 text-center text-xs tabular-nums">
                        {session.present}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        }
      </QueryState>
      <p className="text-xs text-muted-foreground">{t("footnote")}</p>
    </Section>
  )
}

export function StageAttendancePage() {
  return <StageLayout tab="attendance">{(stage) => <History stage={stage} />}</StageLayout>
}
