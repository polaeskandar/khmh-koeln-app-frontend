"use client"

import { useTranslations } from "next-intl"
import { Suspense } from "react"

import { QueryErrorState, QueryState } from "@/components/page-states"
import { isolate } from "@/lib/bidi"
import { routes } from "@/lib/routes"

import {
  type ChildSummary,
  type TaskState,
  useChildHomework,
  useParentChildren,
  useSelectedChild,
} from "./api"
import { ChildSwitcher, ListSkeleton, TaskList } from "./parent-bits"

function UnlinkedChild() {
  const children = useParentChildren()

  return children.isError ? (
    <QueryErrorState error={children.error} onRetry={() => children.refetch()} />
  ) : (
    <ListSkeleton />
  )
}

function Tasks({ child, state }: { child: ChildSummary; state: TaskState }) {
  const t = useTranslations("parent.homework")
  const query = useChildHomework(child.id, state)

  return (
    <QueryState query={query} loading={<ListSkeleton />} notFound={<UnlinkedChild />}>
      {(data) => (
        <TaskList
          title={state === "todo" ? t("toDo") : t("done")}
          tasks={data.items}
          today={data.today}
          href={(task) => routes.parentHomeworkTask(task.id, child.id)}
          empty={state === "todo" ? t("emptyToDo", { name: child.name }) : t("emptyDone")}
        />
      )}
    </QueryState>
  )
}

function ChildHomework({ items }: { items: ChildSummary[] }) {
  const t = useTranslations("parent")
  const selected = useSelectedChild(items)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t("nav.homework")}
        </h1>
        {selected ? (
          <p className="text-sm text-muted-foreground">
            {selected.stage
              ? t("homework.description", {
                  stage: isolate(selected.stage),
                  name: isolate(selected.name),
                })
              : t("homework.descriptionNoStage", { name: isolate(selected.name) })}
          </p>
        ) : null}
      </header>
      {selected ? (
        <>
          <ChildSwitcher
            items={items}
            selectedId={selected.id}
            href={(child) => routes.parentHomework(child)}
          />
          <div key={selected.id} className="flex min-w-0 flex-col gap-8">
            <Tasks child={selected} state="todo" />
            <Tasks child={selected} state="done" />
          </div>
        </>
      ) : (
        <p className="border border-dashed p-6 text-sm text-muted-foreground">
          {t("homework.noChild")}
        </p>
      )}
    </div>
  )
}

function Homework() {
  const query = useParentChildren()

  return (
    <QueryState query={query} loading={<ListSkeleton />}>
      {(data) => <ChildHomework items={data.items} />}
    </QueryState>
  )
}

export function ParentHomework() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Homework />
    </Suspense>
  )
}
