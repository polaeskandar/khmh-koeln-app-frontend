"use client"

import { Info, Link2Off } from "lucide-react"
import { useTranslations } from "next-intl"

import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/features/auth/session"
import { ListSkeleton, TaskList } from "@/features/parent/parent-bits"
import { useFormat } from "@/i18n/format"
import { ApiError } from "@/lib/api/problem"
import { localTimeOf } from "@/lib/domain/time"
import { routes } from "@/lib/routes"

import { type MemberTask, useMemberGroups, useMemberHomework, useMemberMeetings } from "./api"
import { GroupCard, MeetingList } from "./member-bits"

const NEXT_MEETINGS = 6
const DONE_RECENTLY = 3

const taskHref = (task: MemberTask) => routes.memberHomeworkTask(task.id)

function partOfDay(): "morning" | "afternoon" | "evening" {
  const hour = Number(localTimeOf(Date.now()).slice(0, 2))

  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"
}

function Homework({ which }: { which: "todo" | "done" }) {
  const t = useTranslations("member.home")
  const toDo = useMemberHomework("todo")
  const done = useMemberHomework("done")

  if (!toDo.data || !done.data) {
    return which === "todo" ? <ListSkeleton /> : null
  }

  if (which === "done") {
    return done.data.items.length > 0 ? (
      <TaskList
        title={t("doneRecently")}
        tasks={done.data.items.slice(0, DONE_RECENTLY)}
        today={done.data.today}
        href={taskHref}
      />
    ) : null
  }

  if (toDo.data.items.length === 0 && done.data.items.length === 0) {
    return null
  }

  return (
    <TaskList
      title={t("toDo")}
      tasks={toDo.data.items}
      today={toDo.data.today}
      href={taskHref}
      empty={t("emptyToDo")}
    />
  )
}

function Meetings() {
  const t = useTranslations("member.home")
  const query = useMemberMeetings()

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
  const query = useMemberGroups()

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

export function MemberHome() {
  const t = useTranslations("parent.home")
  const f = useFormat()
  const { session } = useSession()
  const groups = useMemberGroups()

  if (session.status !== "authenticated") {
    return <ListSkeleton />
  }

  const { me } = session
  const unlinked = !me.member || (groups.error instanceof ApiError && groups.error.status === 403)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t(`greeting.${partOfDay()}`, { name: me.account.displayName.split(" ")[0] })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {f.longDate(me.today)} · {f.copticDate(me.today)}
        </p>
      </header>
      {unlinked ? (
        <NotLinked />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <div className="flex min-w-0 flex-col gap-8">
            <Homework which="todo" />
            <Meetings />
            <Homework which="done" />
          </div>
          <Groups />
        </div>
      )}
    </div>
  )
}
