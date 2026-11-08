"use client"

import { Check, CircleCheck, Undo2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { QueryKey } from "@tanstack/react-query"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import type { Report } from "@/features/learning/parent/api"

const NOT_DONE: Report = {
  done: false,
  completedAt: null,
  completedBy: null,
  completedByYou: false,
}

const SAVING: Report = { done: true, completedAt: null, completedBy: null, completedByYou: true }

export function reportOf(task: Report): Report {
  const { done, completedAt, completedBy, completedByYou } = task

  return { done, completedAt, completedBy, completedByYou }
}

export function CompletionControl({
  today,
  initial,
  hint,
  undone,
  reportDone,
  undoReport,
  invalidate,
}: {
  today: LocalDate
  initial: Report
  hint: string
  undone: string
  reportDone: () => Promise<Report>
  undoReport: () => Promise<void>
  invalidate: QueryKey[]
}) {
  const t = useTranslations("parent.completion")
  const f = useFormat()
  const [local, setLocal] = useState<{ report: Report; from: Report } | null>(null)
  const busy = useRef(false)
  const markDone = useApiMutation(reportDone, { invalidate })
  const undo = useApiMutation(undoReport, { invalidate, successMessage: undone })
  const pending = markDone.pending || undo.pending
  const report = local && (pending || local.from === initial) ? local.report : initial

  async function change(next: Report, run: () => Promise<Report | null>) {
    if (busy.current) {
      return
    }

    busy.current = true
    const before = report
    setLocal({ report: next, from: initial })

    try {
      setLocal({ report: (await run()) ?? before, from: initial })
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
        <p className="text-xs text-muted-foreground">{hint}</p>
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
