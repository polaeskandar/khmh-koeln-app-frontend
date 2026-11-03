"use client"

import { useTranslations } from "next-intl"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { ServiceTag } from "@/components/service-tag"
import {
  agendaHref,
  createdOnOf,
  SessionCardView,
  useSessionLines,
} from "@/components/session-bits"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { CardAction } from "@/features/attendance/attendance-overview"
import { useSession } from "@/features/auth/session"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import type { LocalDate } from "@/lib/api/types/common"
import { groupOf } from "@/lib/api/types/meetings"
import { addDays, localTimeOf } from "@/lib/domain/time"
import { routes } from "@/lib/routes"

import { type Dashboard as DashboardData, useDashboard } from "./api"
import { groupUpcoming, type UpcomingEntry } from "./group-upcoming"

function partOfDay(): "morning" | "afternoon" | "evening" {
  const hour = Number(localTimeOf(Date.now()).slice(0, 2))

  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"
}

const meetingsOn = (date: LocalDate, service: string) =>
  `${routes.meetings()}?date=${date}&service=${service}`

function Summary({ data }: { data: DashboardData }) {
  const t = useTranslations("dashboard.summary")
  const f = useFormat()

  if (data.sessions.length === 0) {
    return <>{t("none")}</>
  }

  const open = data.sessions.filter((session) => session.status === "active").length

  const notOpened = data.sessions.filter(
    (session) => session.status === "scheduled" && session.date <= data.today
  ).length

  const parts = [
    open > 0 ? t("open", { count: open }) : null,
    notOpened > 0 ? t("notOpened", { count: notOpened }) : null,
  ].filter((part): part is string => part !== null)

  return parts.length > 0 ? <>{`${parts.join(f.separator)}.`}</> : null
}

function Today({ data }: { data: DashboardData }) {
  const t = useTranslations("dashboard.today")
  const f = useFormat()

  if (data.sessions.length === 0) {
    const tomorrow = addDays(data.today, 1)
    const names = [...new Set(data.upcoming.filter((item) => item.date === tomorrow).map(groupOf))]

    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>{t("empty")}</EmptyTitle>
          <EmptyDescription>
            {names.length > 0 ? t("tomorrow", { names: f.list(names) }) : t("checkMeetings")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.sessions.map((session) => (
        <SessionCardView
          key={session.id}
          session={session}
          today={data.today}
          href={session.can.record ? undefined : null}
          action={<CardAction session={session} today={data.today} />}
        />
      ))}
    </div>
  )
}

function UpcomingRow({ entry, today }: { entry: UpcomingEntry; today: LocalDate }) {
  const t = useTranslations()
  const f = useFormat()
  const lines = useSessionLines()
  const item = entry.kind === "single" ? entry.item : null
  const service = entry.kind === "single" ? entry.item.service : entry.service
  const date = entry.kind === "single" ? entry.item.date : entry.date
  const startTime = entry.kind === "single" ? entry.item.startTime : entry.startTime
  const title = entry.kind === "single" ? entry.item.title : entry.title
  const planned = entry.kind === "single" ? entry.item.kind === "planned" : entry.planned

  const label =
    entry.kind === "single"
      ? groupOf(entry.item)
      : entry.groups.length === 2
        ? f.list(entry.groups)
        : `${entry.service.name} · ${t("dashboard.stagesCount", { count: entry.groups.length })}`

  const href =
    item && item.kind === "session"
      ? (agendaHref(item) ?? meetingsOn(date, service.id))
      : meetingsOn(date, service.id)

  const canceled = item?.kind === "session" && item.status === "canceled"

  return (
    <li>
      <Link
        href={href}
        className="-mx-2 flex min-w-0 items-start gap-4 px-2 py-3 hover:bg-muted/60"
      >
        <span className="w-12 shrink-0 text-sm tabular-nums">{startTime}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={canceled ? "text-muted-foreground line-through" : "font-medium"}>
            <bdi>{label}</bdi>
            <span className="font-normal text-muted-foreground">
              {" · "}
              <bdi>{title}</bdi>
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
            <ServiceTag service={service} />
            {planned ? <span>{lines.createdOn(createdOnOf({ date }, today), today)}</span> : null}
            {canceled ? <span>{t("status.canceled")}</span> : null}
          </span>
        </span>
      </Link>
    </li>
  )
}

function ComingUp({ data }: { data: DashboardData }) {
  const t = useTranslations("dashboard.comingUp")
  const f = useFormat()
  const entries = groupUpcoming(data.upcoming)

  const days = [
    ...new Set(entries.map((entry) => (entry.kind === "single" ? entry.item.date : entry.date))),
  ]

  return (
    <Section id="coming-up" title={t("title")} description={t("description")}>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {days.map((day) => (
            <section key={day} className="flex flex-col gap-1" aria-labelledby={`day-${day}`}>
              <h3
                id={`day-${day}`}
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {f.relativeDay(day, data.today)}
              </h3>
              <ul className="divide-y border-y">
                {entries
                  .filter(
                    (entry) => (entry.kind === "single" ? entry.item.date : entry.date) === day
                  )
                  .map((entry, index) => (
                    <UpcomingRow key={index} entry={entry} today={data.today} />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Section>
  )
}

function DashboardView({ data }: { data: DashboardData }) {
  const t = useTranslations()
  const f = useFormat()
  const { session } = useSession()

  const firstName =
    session.status === "authenticated" ? session.me.account.displayName.split(" ")[0] : ""

  return (
    <PageBody>
      <PageHeader
        title={t(`dashboard.greeting.${partOfDay()}`, { name: firstName })}
        description={
          <span className="flex flex-col gap-0.5">
            <span>
              {f.longDate(data.today)} · {f.copticDate(data.today)}
            </span>
            <span>
              <Summary data={data} />
            </span>
          </span>
        }
      />
      <Section
        id="today"
        title={t("dashboard.today.title")}
        description={t("dashboard.today.description")}
        actions={
          <Link href={routes.meetings()} className="text-sm underline-offset-4 hover:underline">
            {t("dashboard.today.allMeetings")}
          </Link>
        }
      >
        <Today data={data} />
      </Section>
      <ComingUp data={data} />
    </PageBody>
  )
}

export function Dashboard() {
  const t = useTranslations("nav")
  const query = useDashboard()

  return (
    <>
      <Topbar crumbs={[{ label: t("dashboard") }]} />
      <QueryState query={query}>{(data) => <DashboardView data={data} />}</QueryState>
    </>
  )
}
