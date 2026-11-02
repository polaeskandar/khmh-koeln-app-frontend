"use client"

import { CircleAlert, ClipboardCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { AgendaRow, SessionCardView } from "@/components/session-bits"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import type { LocalDate } from "@/lib/api/types/common"
import { routes } from "@/lib/routes"

import {
  type AttendanceOverview as Overview,
  type OverviewSession,
  useAttendanceOverview,
} from "./api"

function CardAction({ session, today }: { session: OverviewSession; today: LocalDate }) {
  const t = useTranslations("attendance")

  if (!session.can.record || session.status === "canceled") {
    return null
  }

  if (session.status === "active") {
    return (
      <Button size="sm" asChild>
        <Link href={routes.takeAttendance(session.id)}>
          <ClipboardCheck data-icon="inline-start" />
          {t("take")}
        </Link>
      </Button>
    )
  }

  if (session.status === "scheduled" && session.date <= today) {
    return (
      <Button size="sm" variant="outline" asChild>
        <Link href={routes.takeAttendance(session.id)}>{t("open")}</Link>
      </Button>
    )
  }

  if (session.status === "completed") {
    return (
      <Button size="sm" variant="outline" asChild>
        <Link href={routes.attendanceSummary(session.id)}>{t("view")}</Link>
      </Button>
    )
  }

  return null
}

function Today({ overview }: { overview: Overview }) {
  const t = useTranslations("attendance.home")

  if (overview.sessions.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardCheck />
          </EmptyMedia>
          <EmptyTitle>{t("empty")}</EmptyTitle>
          <EmptyDescription>
            {t.rich("emptyLink", {
              link: (chunks) => (
                <Link href={routes.meetings()} className="underline underline-offset-4">
                  {chunks}
                </Link>
              ),
            })}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {overview.sessions.map((session) => (
        <SessionCardView
          key={session.id}
          session={session}
          today={overview.today}
          href={session.can.record ? undefined : null}
          action={<CardAction session={session} today={overview.today} />}
        />
      ))}
    </div>
  )
}

function Lists({ overview }: { overview: Overview }) {
  const t = useTranslations("attendance.home")
  const f = useFormat()

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {overview.earlier.length > 0 ? (
        <Section id="earlier" title={t("earlier")} description={t("earlierDescription")}>
          <ul className="divide-y border-y">
            {overview.earlier.map((session) => (
              <li key={session.id}>
                <AgendaRow
                  item={{ ...session, kind: "session" }}
                  today={overview.today}
                  href={routes.takeAttendance(session.id)}
                  trailing={
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-warning uppercase">
                      <CircleAlert className="size-3.5" aria-hidden="true" />
                      {session.status === "active" ? t("notClosed") : t("notTaken")}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <Section id="closed" title={t("recent")}>
        {overview.closed.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("recentEmpty")}</p>
        ) : (
          <ul className="divide-y border-y">
            {overview.closed.map((session) => (
              <li key={session.id}>
                <AgendaRow
                  item={{ ...session, kind: "session" }}
                  today={overview.today}
                  href={routes.attendanceSummary(session.id)}
                  trailing={
                    <span className="text-xs text-muted-foreground">
                      {session.closedAt
                        ? t("closedAt", { when: f.atLabel(session.closedAt, overview.today) })
                        : t("closed")}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

export function AttendanceOverview() {
  const t = useTranslations()
  const f = useFormat()
  const query = useAttendanceOverview()

  return (
    <>
      <Topbar crumbs={[{ label: t("nav.attendance") }]} />
      <PageBody>
        <QueryState query={query}>
          {(overview) => (
            <>
              <PageHeader
                title={t("nav.attendance")}
                description={t("attendance.home.description", {
                  date: f.longDate(overview.today),
                })}
              />
              <Section id="today" title={t("attendance.home.today")}>
                <Today overview={overview} />
              </Section>
              <Lists overview={overview} />
            </>
          )}
        </QueryState>
      </PageBody>
    </>
  )
}

export function StaffHome() {
  const router = useRouter()
  useEffect(() => router.replace(routes.attendance()), [router])

  return null
}
