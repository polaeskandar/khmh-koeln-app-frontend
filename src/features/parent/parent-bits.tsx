"use client"

import { cn } from "cn"
import { Check, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { MemberAvatar } from "@/components/member-avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { DueLine } from "@/features/homework/homework-bits"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import type { LocalDate, Uuid } from "@/lib/api/types/common"
import { routes } from "@/lib/routes"

import type { ChildSummary, ParentTask } from "./api"

export function ChildSwitcher({
  items,
  selectedId,
  href,
}: {
  items: ChildSummary[]
  selectedId: Uuid
  href: (child: Uuid) => string
}) {
  const t = useTranslations("parent.switcher")

  return (
    <nav aria-label={t("label")} className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-2">
        {items.map((child) => {
          const current = child.id === selectedId

          return (
            <li key={child.id}>
              <Link
                href={href(child.id)}
                scroll={false}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex h-14 items-center gap-3 border px-3 pe-4 transition-colors hover:bg-muted/60",
                  current && "border-foreground bg-muted/40 ring-1 ring-foreground"
                )}
              >
                <MemberAvatar name={child.fullName} initials={child.initials} seed={child.id} />
                <span className="flex flex-col leading-tight">
                  <span dir="auto" className="text-sm font-semibold">
                    {child.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {child.stage ?? t("noClass")} ·{" "}
                    {child.toDo > 0 ? t("toDo", { count: child.toDo }) : t("allDone")}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function TaskCard({
  task,
  today,
  child,
}: {
  task: ParentTask
  today: LocalDate
  child: Uuid
}) {
  const t = useTranslations("parent.task")
  const f = useFormat()
  const when = task.completedAt ? f.atLabel(task.completedAt, today) : ""

  return (
    <Link
      href={routes.parentHomeworkTask(task.id, child)}
      className={cn(
        "flex items-center gap-4 border p-4 transition-colors hover:bg-muted/60",
        task.done && "bg-muted/30"
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center border",
          task.done
            ? "border-success bg-success text-success-foreground"
            : "border-dashed text-transparent"
        )}
        aria-hidden="true"
      >
        <Check className="size-4" />
      </span>
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
        {task.done ? (
          <span className="text-xs text-success">
            {task.completedByYou
              ? t("doneByYou", { when })
              : task.completedBy
                ? t("doneBy", { name: task.completedBy, when })
                : t("doneByParent", { when })}
          </span>
        ) : (
          <DueLine dueDate={task.dueDate} today={today} />
        )}
      </span>
      <span className="sr-only">{task.done ? t("done") : t("toDo")}</span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
        aria-hidden="true"
      />
    </Link>
  )
}

export function TaskList({
  title,
  tasks,
  today,
  child,
  empty,
}: {
  title: string
  tasks: ParentTask[]
  today: LocalDate
  child: Uuid
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
              <TaskCard task={task} today={today} child={child} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function ListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
