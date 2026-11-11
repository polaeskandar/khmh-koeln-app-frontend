"use client"

import { Check, CircleCheck, Undo2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { QueryKey } from "@tanstack/react-query"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import type { Report } from "./api"

const NOT_DONE: Report = {
  done: false,
  completedAt: null,
  completedBy: null,
  completedByYou: false,
}

const SAVING: Report = { done: true, completedAt: null, completedBy: null, completedByYou: true }

type DoneByTexts = { byYou: string; byName: (name: string) => string; byParent: string }

export function doneByText(report: Report, texts: DoneByTexts): string {
  if (report.completedByYou) {
    return texts.byYou
  }

  if (report.completedBy) {
    return texts.byName(report.completedBy)
  }

  return texts.byParent
}

export function reportOf(task: Report): Report {
  const { done, completedAt, completedBy, completedByYou } = task

  return { done, completedAt, completedBy, completedByYou }
}

type CompletionOptions = {
  initial: Report
  undone: string
  reportDone: () => Promise<Report>
  undoReport: () => Promise<void>
  invalidate: QueryKey[]
}

export function useCompletion({
  initial,
  undone,
  reportDone,
  undoReport,
  invalidate,
}: CompletionOptions) {
  const [local, setLocal] = useState<{ report: Report; from: Report } | null>(null)
  const done = useApiMutation(reportDone, { invalidate })
  const undo = useApiMutation(undoReport, { invalidate, successMessage: undone })
  const pending = done.pending || undo.pending
  const report = local && (pending || local.from === initial) ? local.report : initial

  const change = useSubmitOnce(async (next: Report, run: () => Promise<Report | null>) => {
    const before = report
    setLocal({ report: next, from: initial })

    setLocal({ report: (await run()) ?? before, from: initial })
  })

  return {
    report,
    pending,
    saving: report.done && report.completedAt === null,
    markDone: () =>
      void change(SAVING, async () => {
        const result = await done.execute()

        return result.ok ? result.data : null
      }),
    undo: () => void change(NOT_DONE, async () => ((await undo.execute()).ok ? NOT_DONE : null)),
  }
}

export function CompletionControl({
  today,
  hint,
  ...options
}: CompletionOptions & {
  today: LocalDate
  hint: string
}) {
  const t = useTranslations("parent.completion")
  const f = useFormat()
  const { report, pending, saving, markDone, undo } = useCompletion(options)

  if (!report.done) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          className="h-12 w-full sm:w-auto sm:self-start"
          disabled={pending}
          onClick={markDone}
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
            : doneByText(report, {
                byYou: t("byYou", { when }),
                byName: (name) => t("byName", { name, when }),
                byParent: t("byParent", { when }),
              })}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="self-start sm:self-center"
        disabled={pending || saving}
        onClick={undo}
      >
        <Undo2 data-icon="inline-start" />
        {t("undo")}
      </Button>
    </div>
  )
}
