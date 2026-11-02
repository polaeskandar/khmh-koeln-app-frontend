"use client"

import { Check, CircleCheck, Undo2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { useFormat } from "@/i18n/format"
import type { LocalDate, Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { type Report, reportDoneRequest, undoReportRequest } from "./api"

const NOT_DONE: Report = {
  done: false,
  completedAt: null,
  completedBy: null,
  completedByYou: false,
}

const SAVING: Report = { done: true, completedAt: null, completedBy: null, completedByYou: true }

export function CompletionControl({
  homeworkId,
  child,
  today,
  initial,
}: {
  homeworkId: Uuid
  child: { id: Uuid; name: string }
  today: LocalDate
  initial: Report
}) {
  const t = useTranslations("parent.completion")
  const f = useFormat()
  const [report, setReport] = useState(initial)
  const busy = useRef(false)
  const invalidate = [["parent"]]
  const markDone = useApiMutation(() => reportDoneRequest(child.id, homeworkId), { invalidate })

  const undo = useApiMutation(() => undoReportRequest(child.id, homeworkId), {
    invalidate,
    successMessage: t("undone", { name: child.name }),
  })

  const pending = markDone.pending || undo.pending

  async function change(next: Report, run: () => Promise<Report | null>) {
    if (busy.current) {
      return
    }

    busy.current = true
    const before = report
    setReport(next)

    try {
      setReport((await run()) ?? before)
    } finally {
      busy.current = false
    }
  }

  if (!report.done) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          className="h-12 w-full sm:w-auto sm:self-start"
          disabled={pending}
          onClick={() =>
            void change(SAVING, async () => {
              const result = await markDone.execute()

              return result.ok ? result.data : null
            })
          }
        >
          <Check data-icon="inline-start" />
          {t("markDone")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("hint", { name: child.name })}</p>
      </div>
    )
  }

  const when = report.completedAt ? f.atLabel(report.completedAt, today) : null

  return (
    <div
      role="status"
      className="flex flex-col gap-3 border border-success/40 bg-success-soft p-4 sm:flex-row sm:items-center"
    >
      <CircleCheck className="size-8 shrink-0 text-success" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-heading text-base font-semibold">{t("done")}</span>
        <span className="text-sm text-muted-foreground">
          {when === null
            ? t("saving")
            : report.completedByYou
              ? t("byYou", { when })
              : report.completedBy
                ? t("byName", { name: report.completedBy, when })
                : t("byParent", { when })}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="self-start sm:self-center"
        disabled={pending || when === null}
        onClick={() =>
          void change(NOT_DONE, async () => ((await undo.execute()).ok ? NOT_DONE : null))
        }
      >
        <Undo2 data-icon="inline-start" />
        {t("undo")}
      </Button>
    </div>
  )
}
