"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"
import { Suspense } from "react"

import { QueryState } from "@/components/page-states"
import { CompletionControl, reportOf } from "./completion-control"
import { ListSkeleton } from "./task-list"
import { HomeworkTaskView } from "./parent-task"
import { useSearchParamId } from "@/hooks/use-search-param-id"
import { Link } from "@/i18n/navigation"
import type { Uuid } from "@/lib/api/types/common"
import { routes } from "@/lib/routes"

import {
  type MemberTaskDetail,
  memberTaskQuery,
  reportOwnDoneRequest,
  undoOwnReportRequest,
} from "./api"
import { MemberNotAvailable } from "@/features/portals/member/member-shell"

function TaskView({ data }: { data: MemberTaskDetail }) {
  const t = useTranslations("member")
  const { task, today } = data

  return (
    <HomeworkTaskView
      data={data}
      forText={t("homework.forYou")}
      back={
        <Link
          href={routes.memberHomework()}
          className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("nav.homework")}
        </Link>
      }
    >
      <CompletionControl
        today={today}
        initial={reportOf(task)}
        hint={t("completion.hint")}
        undone={t("completion.undone")}
        reportDone={() => reportOwnDoneRequest(task.id)}
        undoReport={() => undoOwnReportRequest(task.id)}
        invalidate={[["member"]]}
      />
    </HomeworkTaskView>
  )
}

function Task({ id }: { id: Uuid }) {
  const query = useQuery(memberTaskQuery(id))

  return (
    <QueryState query={query} loading={<ListSkeleton />} notFound={<MemberNotAvailable />}>
      {(data) => <TaskView data={data} />}
    </QueryState>
  )
}

function TaskPage() {
  const id = useSearchParamId("id")

  if (!id) {
    return <MemberNotAvailable />
  }

  return <Task key={id} id={id} />
}

export function MemberTaskPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <TaskPage />
    </Suspense>
  )
}
