"use client"

import type { QueryKey } from "@tanstack/react-query"
import { cn } from "cn"
import { Check, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import type { LocalDate, Uuid } from "@/lib/api/types/common"
import { isolate } from "@/lib/bidi"

import {
  CHILD_REPORT_QUERIES,
  OWN_REPORT_QUERIES,
  type ParentTask,
  type Report,
  reportDoneRequest,
  reportOwnDoneRequest,
  undoOwnReportRequest,
  undoReportRequest,
} from "./api"
import { useCompletion } from "./completion-control"
import { DueLine } from "./homework-bits"

export type TaskCompletion = {
  label: (task: ParentTask) => string
  undone: string
  reportDone: (task: ParentTask) => Promise<Report>
  undoReport: (task: ParentTask) => Promise<void>
  invalidate: QueryKey[]
}

export function useChildCompletion(child: { id: Uuid; name: string }): TaskCompletion {
  const t = useTranslations("parent")

  return {
    label: (task) => t("task.markDone", { title: isolate(task.title), name: isolate(child.name) }),
    undone: t("completion.undone", { name: child.name }),
    reportDone: (task) => reportDoneRequest(child.id, task.id),
    undoReport: (task) => undoReportRequest(child.id, task.id),
    invalidate: CHILD_REPORT_QUERIES,
  }
}

export function useOwnCompletion(): TaskCompletion {
  const t = useTranslations("member")

  return {
    label: (task) => t("homework.markDone", { title: isolate(task.title) }),
    undone: t("completion.undone"),
    reportDone: (task) => reportOwnDoneRequest(task.id),
    undoReport: (task) => undoOwnReportRequest(task.id),
    invalidate: OWN_REPORT_QUERIES,
  }
}

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"

function TaskCard({
  task,
  today,
  href,
  completion,
}: {
  task: ParentTask
  today: LocalDate
  href: (task: ParentTask) => string
  completion: TaskCompletion
}) {
  const t = useTranslations("parent")
  const f = useFormat()

  const { report, pending, saving, markDone, undo } = useCompletion({
    initial: task,
    undone: completion.undone,
    reportDone: () => completion.reportDone(task),
    undoReport: () => completion.undoReport(task),
    invalidate: completion.invalidate,
  })

  const busy = pending || saving
  const when = report.completedAt ? f.atLabel(report.completedAt, today) : ""

  function toggle(event: React.MouseEvent) {
    if (busy || event.detail > 1) {
      return
    }

    if (report.done) {
      undo()
    } else {
      markDone()
    }
  }

  return (
    <div className={cn("flex border transition-colors", report.done && "bg-muted/30")}>
      <button
        type="button"
        aria-label={completion.label(task)}
        aria-pressed={report.done}
        aria-disabled={busy || undefined}
        className={cn(
          "flex min-h-11 min-w-11 shrink-0 items-center justify-center px-4 hover:bg-muted/60 aria-disabled:cursor-progress",
          FOCUS_RING
        )}
        onClick={toggle}
      >
        <span
          className={cn(
            "flex size-9 items-center justify-center border",
            report.done
              ? "border-success bg-success text-success-foreground"
              : "border-dashed text-transparent"
          )}
          aria-hidden="true"
        >
          <Check className="size-4" />
        </span>
      </button>
      <Link
        href={href(task)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-4 py-4 pe-4 hover:bg-muted/60",
          FOCUS_RING
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            dir="auto"
            className="font-heading text-base leading-snug font-semibold tracking-tight"
          >
            {task.title}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            <bdi>{task.lessonTitle}</bdi> · <bdi>{task.stage}</bdi>
          </span>
          {report.done ? (
            <span className="text-xs text-success">
              {saving
                ? t("completion.saving")
                : report.completedByYou
                  ? t("task.doneByYou", { when })
                  : report.completedBy
                    ? t("task.doneBy", { name: report.completedBy, when })
                    : t("task.doneByParent", { when })}
            </span>
          ) : (
            <DueLine dueDate={task.dueDate} today={today} />
          )}
        </span>
        <span className="sr-only">{report.done ? t("task.done") : t("task.toDo")}</span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
          aria-hidden="true"
        />
      </Link>
    </div>
  )
}

export function TaskList({
  title,
  tasks,
  today,
  href,
  completion,
  empty,
}: {
  title: string
  tasks: ParentTask[]
  today: LocalDate
  href: (task: ParentTask) => string
  completion: TaskCompletion
  empty?: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <h2 className="flex items-baseline gap-2 font-heading text-base font-semibold tracking-tight">
        {title}
        <span className="text-sm font-normal text-muted-foreground tabular-nums">
          {tasks.length}
        </span>
      </h2>
      {tasks.length === 0 ? (
        empty ? (
          <div className="border border-dashed p-5 text-sm text-muted-foreground">{empty}</div>
        ) : null
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} today={today} href={href} completion={completion} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
