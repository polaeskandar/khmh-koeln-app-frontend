"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ReactNode, Suspense } from "react"

import { QueryState } from "@/components/page-states"
import { DueLine } from "./due-line"
import { useSearchParamId } from "@/hooks/use-search-param-id"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import type { Uuid } from "@/lib/api/types/common"
import { isolate } from "@/lib/bidi"
import { routes } from "@/lib/routes"

import { parentChildrenQuery } from "@/features/people/children/api"
import {
  CHILD_REPORT_QUERIES,
  type ParentTaskDetail,
  parentTaskQuery,
  reportDoneRequest,
  undoReportRequest,
} from "./api"
import { CompletionControl, reportOf } from "./completion-control"
import { ListSkeleton } from "@/components/list-skeleton"
import { ParentNotAvailable } from "@/features/portals/parent/parent-shell"

const isWebLink = (url: string) => /^https?:\/\//i.test(url)

function BackLink({ child }: { child: ParentTaskDetail["child"] }) {
  const t = useTranslations("parent")
  const children = useQueryClient().getQueryData(parentChildrenQuery.queryKey)
  const several = (children?.items.length ?? 0) > 1

  return (
    <Link
      href={routes.parentHomework(child.id)}
      className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
      {several ? t("homework.backFor", { name: isolate(child.name) }) : t("nav.homework")}
    </Link>
  )
}

type TaskContent = Pick<ParentTaskDetail, "task" | "lesson" | "today">

export function HomeworkTaskView({
  data,
  back,
  forText,
  children,
}: {
  data: TaskContent
  back: ReactNode
  forText: string
  children: ReactNode
}) {
  const t = useTranslations("parent.view")
  const f = useFormat()
  const { task, lesson, today } = data
  const { resources } = task

  return (
    <article className="flex max-w-2xl flex-col gap-6">
      {back}
      <header className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">
          {forText}
          {" · "}
          <bdi>{task.stage}</bdi>
        </span>
        <h1
          dir="auto"
          className="font-heading text-2xl leading-tight font-semibold tracking-tight text-balance md:text-[28px]"
        >
          {task.title}
        </h1>
        <DueLine dueDate={task.dueDate} today={today} className="text-sm" />
      </header>
      <section className="flex flex-col gap-2" aria-label={t("whatToDo")}>
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {t("whatToDo")}
        </h2>
        <p dir="auto" className="text-[15px] leading-relaxed text-pretty whitespace-pre-line">
          {task.instructions}
        </p>
      </section>
      {lesson.passage || lesson.memoryVerse ? (
        <section className="flex flex-col gap-3 bg-muted/50 p-4" aria-label={t("fromLessonLabel")}>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="size-3.5" aria-hidden="true" />
            {t("fromLesson", {
              title: isolate(lesson.title),
              date: f.relativeDayInline(lesson.teachingDate, today),
            })}
          </span>
          {lesson.passage ? (
            <p dir="auto" className="text-sm font-medium">
              {lesson.passage}
            </p>
          ) : null}
          {lesson.memoryVerse ? (
            <blockquote
              dir="auto"
              className="border-s-2 border-primary ps-3 font-heading text-[15px] leading-relaxed text-pretty"
            >
              {lesson.memoryVerse}
            </blockquote>
          ) : null}
        </section>
      ) : null}
      {resources.length > 0 ? (
        <section className="flex flex-col gap-2" aria-label={t("resources")}>
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t("resources")}
          </h2>
          <ul className="flex flex-col gap-2">
            {resources.map((resource, index) => (
              <li key={index} dir="auto" className="text-[15px] break-words">
                {resource.url && isWebLink(resource.url) ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 underline underline-offset-4"
                  >
                    {resource.label}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  resource.label
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {children}
    </article>
  )
}

function TaskView({ data }: { data: ParentTaskDetail }) {
  const t = useTranslations("parent")
  const { task, today, child } = data

  return (
    <HomeworkTaskView
      data={data}
      back={<BackLink child={child} />}
      forText={t("view.forChild", { name: isolate(child.name) })}
    >
      <CompletionControl
        today={today}
        initial={reportOf(task)}
        hint={t("completion.hint", { name: child.name })}
        undone={t("completion.undone", { name: child.name })}
        reportDone={() => reportDoneRequest(child.id, task.id)}
        undoReport={() => undoReportRequest(child.id, task.id)}
        invalidate={CHILD_REPORT_QUERIES}
      />
    </HomeworkTaskView>
  )
}

function Task({ child, id }: { child: Uuid; id: Uuid }) {
  const query = useQuery(parentTaskQuery(child, id))

  return (
    <QueryState query={query} loading={<ListSkeleton />} notFound={<ParentNotAvailable />}>
      {(data) => <TaskView data={data} />}
    </QueryState>
  )
}

function TaskPage() {
  const id = useSearchParamId("id")
  const child = useSearchParamId("child")

  if (!id || !child) {
    return <ParentNotAvailable />
  }

  return <Task key={`${child}-${id}`} child={child} id={id} />
}

export function ParentTaskPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <TaskPage />
    </Suspense>
  )
}
