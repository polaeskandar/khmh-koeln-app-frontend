"use client"

import { useQuery } from "@tanstack/react-query"
import { Info, Link2Off } from "lucide-react"
import { useTranslations } from "next-intl"

import { Section } from "@/components/page-header"
import { QueryErrorState, QueryState } from "@/components/page-states"
import { PortalGreeting } from "@/components/portal/portal-greeting"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/features/identity/auth/session"
import { ListSkeleton } from "@/components/list-skeleton"
import { TaskList, useOwnCompletion } from "@/features/learning/homework/task-list"
import { routes } from "@/lib/routes"
import { type ParentHomeworkItem, memberHomeworkQuery } from "@/features/learning/homework/api"
import { memberGroupsQuery, useMemberGroups } from "@/features/people/groups/api"
import { memberMeetingsQuery } from "@/features/meetings/meetings/api"
import { GroupCard } from "@/features/people/groups/group-card"
import { MeetingList } from "@/features/meetings/meetings/member-meetings"

const NEXT_MEETINGS = 6
const DONE_RECENTLY = 3

const taskHref = (task: ParentHomeworkItem) => routes.memberHomeworkTask(task.id)

function ToDoHomework() {
  const t = useTranslations("member.home")
  const toDo = useQuery(memberHomeworkQuery("todo"))
  const done = useQuery(memberHomeworkQuery("done"))
  const completion = useOwnCompletion()

  if (toDo.isError) {
    return <QueryErrorState error={toDo.error} onRetry={() => toDo.refetch()} />
  }

  if (!toDo.data) {
    return <ListSkeleton />
  }

  if (toDo.data.items.length === 0 && done.data?.items.length === 0) {
    return null
  }

  return (
    <TaskList
      title={t("toDo")}
      tasks={toDo.data.items}
      today={toDo.data.today}
      href={taskHref}
      completion={completion}
      empty={t("emptyToDo")}
    />
  )
}

function DoneHomework() {
  const t = useTranslations("member.home")
  const done = useQuery(memberHomeworkQuery("done"))
  const completion = useOwnCompletion()

  if (done.isError) {
    return <QueryErrorState error={done.error} onRetry={() => done.refetch()} />
  }

  if (!done.data || done.data.items.length === 0) {
    return null
  }

  return (
    <TaskList
      title={t("doneRecently")}
      tasks={done.data.items.slice(0, DONE_RECENTLY)}
      today={done.data.today}
      href={taskHref}
      completion={completion}
    />
  )
}

function Meetings() {
  const t = useTranslations("member.home")
  const query = useQuery(memberMeetingsQuery)

  return (
    <Section id="next-meetings" title={t("nextMeetings")} description={t("nextMeetingsHint")}>
      <QueryState query={query} loading={<ListSkeleton />}>
        {(data) => <MeetingList meetings={data.items.slice(0, NEXT_MEETINGS)} today={data.today} />}
      </QueryState>
    </Section>
  )
}

function Groups() {
  const t = useTranslations("member.home")
  const query = useQuery(memberGroupsQuery)

  return (
    <aside className="flex min-w-0 flex-col gap-4" aria-labelledby="your-groups">
      <h2 id="your-groups" className="font-heading text-base font-semibold tracking-tight">
        {t("yourGroups")}
      </h2>
      <QueryState query={query} loading={<Skeleton className="h-40 w-full" />}>
        {(data) =>
          data.items.length === 0 ? (
            <p className="border border-dashed p-5 text-sm text-muted-foreground">
              {t("noGroups")}
            </p>
          ) : (
            data.items.map((group) => <GroupCard key={group.id} group={group} today={data.today} />)
          )
        }
      </QueryState>
      <p className="flex items-start gap-2 bg-muted/50 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {t("whatYouSee")}
      </p>
    </aside>
  )
}

function NotLinked() {
  const t = useTranslations("member.home.notLinked")

  return (
    <div className="flex flex-col gap-2 border border-dashed p-6">
      <h2 className="inline-flex items-center gap-2 font-heading text-lg font-semibold">
        <Link2Off className="size-4 text-muted-foreground" aria-hidden="true" />
        {t("title")}
      </h2>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
    </div>
  )
}

export function MemberHomePage() {
  const { session } = useSession()
  const groups = useMemberGroups()

  if (session.status !== "authenticated") {
    return <ListSkeleton />
  }

  const { me } = session
  const unlinked = !me.member || groups.unlinked

  return (
    <div className="flex flex-col gap-8">
      <PortalGreeting name={me.account.displayName} today={me.today} />
      {unlinked ? (
        <NotLinked />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <div className="flex min-w-0 flex-col gap-8">
            <ToDoHomework />
            <Meetings />
            <DoneHomework />
          </div>
          <Groups />
        </div>
      )}
    </div>
  )
}
