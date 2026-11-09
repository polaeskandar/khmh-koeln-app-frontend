"use client"

import { useTranslations } from "next-intl"

import { QueryState } from "@/components/page-states"
import type { TaskState } from "./api"
import { ListSkeleton, TaskList, useOwnCompletion } from "./task-list"
import { ApiError } from "@/lib/api/problem"
import { routes } from "@/lib/routes"

import { type MemberTask, useMemberHomework } from "./api"

const taskHref = (task: MemberTask) => routes.memberHomeworkTask(task.id)

function Tasks({ state }: { state: TaskState }) {
  const t = useTranslations("member.homework")
  const query = useMemberHomework(state)
  const completion = useOwnCompletion()

  if (query.error instanceof ApiError && query.error.status === 403) {
    return null
  }

  return (
    <QueryState query={query} loading={<ListSkeleton />}>
      {(data) => (
        <TaskList
          title={state === "todo" ? t("toDo") : t("done")}
          tasks={data.items}
          today={data.today}
          href={taskHref}
          completion={completion}
          empty={state === "todo" ? t("emptyToDo") : t("emptyDone")}
        />
      )}
    </QueryState>
  )
}

export function MemberHomework() {
  const t = useTranslations("member")
  const toDo = useMemberHomework("todo")
  const unlinked = toDo.error instanceof ApiError && toDo.error.status === 403

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t("nav.homework")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("homework.description")}</p>
      </header>
      {unlinked ? (
        <p className="border border-dashed p-6 text-sm text-muted-foreground">
          {t("homework.notLinked")}
        </p>
      ) : (
        <div className="flex min-w-0 flex-col gap-8">
          <Tasks state="todo" />
          <Tasks state="done" />
        </div>
      )}
    </div>
  )
}
