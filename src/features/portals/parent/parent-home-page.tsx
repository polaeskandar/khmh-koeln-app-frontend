"use client"

import { useQuery } from "@tanstack/react-query"
import { Info } from "lucide-react"
import { useTranslations } from "next-intl"
import { Suspense } from "react"

import { QueryErrorState, QueryState } from "@/components/page-states"
import { PortalGreeting } from "@/components/portal/portal-greeting"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/features/identity/auth/session"
import { routes } from "@/lib/routes"
import {
  type ChildSummary,
  type ChildList,
  parentChildrenQuery,
  useSelectedChild,
} from "@/features/people/children/api"
import { useChildHomework } from "@/features/learning/homework/api"
import { ChildSwitcher } from "@/features/people/children/child-switcher"
import { ListSkeleton } from "@/components/list-skeleton"
import { TaskList, useChildCompletion } from "@/features/learning/homework/task-list"

const DONE_RECENTLY = 5

function HomeSkeleton() {
  const t = useTranslations("common")

  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <span className="sr-only">{t("loadingEllipsis")}</span>
    </div>
  )
}

function ChildTasks({ child }: { child: ChildSummary }) {
  const t = useTranslations("parent.home")
  const toDo = useChildHomework(child.id, "todo")
  const done = useChildHomework(child.id, "done")
  const completion = useChildCompletion(child)

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <QueryState query={toDo} loading={<ListSkeleton />} notFound={<ListSkeleton />}>
        {(data) => (
          <TaskList
            title={t("toDoFor", { name: child.name })}
            tasks={data.items}
            today={data.today}
            href={(task) => routes.parentHomeworkTask(task.id, child.id)}
            completion={completion}
            empty={t("emptyToDo")}
          />
        )}
      </QueryState>
      {done.data && done.data.items.length > 0 ? (
        <TaskList
          title={t("doneRecently")}
          tasks={done.data.items.slice(0, DONE_RECENTLY)}
          today={done.data.today}
          href={(task) => routes.parentHomeworkTask(task.id, child.id)}
          completion={completion}
        />
      ) : null}
      {done.isError ? <QueryErrorState error={done.error} onRetry={() => done.refetch()} /> : null}
    </div>
  )
}

function Children({ data }: { data: ChildList }) {
  const t = useTranslations("parent.home")
  const selected = useSelectedChild(data.items)

  if (!selected) {
    return (
      <div className="flex flex-col gap-2 border border-dashed p-6">
        <h2 className="font-heading text-lg font-semibold">{t("noChild.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("noChild.description")}</p>
      </div>
    )
  }

  return (
    <>
      <ChildSwitcher
        items={data.items}
        selectedId={selected.id}
        href={(child) => routes.parentHome(child)}
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <ChildTasks key={selected.id} child={selected} />
        <aside className="flex flex-col gap-3 self-start bg-muted/50 p-5 text-sm">
          <h2 className="inline-flex items-center gap-2 font-heading text-base font-semibold">
            <Info className="size-4 text-muted-foreground" aria-hidden="true" />
            {t("howItWorks.title")}
          </h2>
          <p className="text-muted-foreground">
            {selected.stage
              ? t("howItWorks.afterLesson", { stage: selected.stage })
              : t("howItWorks.afterLessonNoStage")}
          </p>
          <p className="text-muted-foreground">{t("howItWorks.tickOff")}</p>
        </aside>
      </div>
    </>
  )
}

function Home() {
  const { session } = useSession()
  const query = useQuery(parentChildrenQuery)
  const name = session.status === "authenticated" ? session.me.account.displayName : ""

  return (
    <QueryState query={query} loading={<HomeSkeleton />}>
      {(data) => (
        <div className="flex flex-col gap-8">
          <PortalGreeting name={name} today={data.today} />
          <Children data={data} />
        </div>
      )}
    </QueryState>
  )
}

export function ParentHomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home />
    </Suspense>
  )
}
