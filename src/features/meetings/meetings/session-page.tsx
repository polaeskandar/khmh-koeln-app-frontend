"use client"

import { ClipboardCheck, Repeat } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { HistoryTimeline } from "@/components/history-timeline"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { NotFoundState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { ServiceTag } from "@/components/service-tag"
import { SessionBadges, SessionWhen } from "@/components/session-bits"
import { Button } from "@/components/ui/button"
import { useCan } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import { isolate } from "@/lib/bidi"
import { recurrenceOf } from "@/lib/domain/recurrence"
import type { LocalDate } from "@/lib/api/types/common"
import { groupOf, type SessionView } from "@/lib/api/types/meetings"
import { routes } from "@/lib/routes"

import { OpenAttendanceButton } from "@/features/meetings/attendance/open-attendance-button"

import { type MeetingSession, useMeetingSession } from "./api"
import { SessionManageMenu } from "./session-dialogs"

function AttendanceAction({ session, today }: { session: SessionView; today: LocalDate }) {
  const t = useTranslations()
  const router = useRouter()
  const can = useCan()
  const records = can("create", "attendance")

  if (session.status === "active" && records) {
    return (
      <Button asChild>
        <Link href={routes.takeAttendance(session.id)}>
          <ClipboardCheck data-icon="inline-start" />
          {t("nav.takeAttendance")}
        </Link>
      </Button>
    )
  }

  if (session.status === "scheduled" && session.date <= today && records) {
    return (
      <OpenAttendanceButton
        session={session.id}
        onOpened={() => router.push(routes.takeAttendance(session.id))}
      />
    )
  }

  if (session.status === "completed" && can("read", "attendance")) {
    return (
      <Button variant="outline" asChild>
        <Link href={routes.attendanceSummary(session.id)}>
          {t("meetings.session.viewAttendance")}
        </Link>
      </Button>
    )
  }

  return null
}

function SessionDetail({ data, actions }: { data: MeetingSession; actions?: ReactNode }) {
  const t = useTranslations()
  const f = useFormat()
  const can = useCan()
  const { session, schedule, today } = data
  const canceled = session.status === "canceled"

  const attendanceNote = canceled
    ? t("meetings.session.noAttendance")
    : session.status !== "scheduled"
      ? null
      : session.date <= today
        ? t("meetings.session.notOpenYet")
        : t("meetings.session.takenOn", { date: f.longDate(session.date) })

  return (
    <>
      <Topbar
        crumbs={[
          { label: t("nav.meetings"), href: routes.meetings() },
          {
            label: t("meetings.session.crumb", {
              group: groupOf(session),
              date: f.longDate(session.date).replace(/ \d{4}$/, ""),
            }),
          },
        ]}
      />
      <PageBody>
        <PageHeader
          meta={
            <>
              <ServiceTag service={session.service} />
              <SessionBadges item={{ ...session, kind: "session" }} />
            </>
          }
          title={groupOf(session)}
          description={
            <>
              <span dir="auto">{session.title}</span> · {f.longDate(session.date)}
            </>
          }
          actions={
            <>
              <AttendanceAction session={session} today={today} />
              {session.status === "scheduled" && can("update", "sessions") ? (
                <SessionManageMenu session={session} />
              ) : null}
              {actions}
            </>
          }
        >
          <SessionWhen item={session} today={today} className="mt-1" />
        </PageHeader>
        {canceled ? (
          <p role="status" className="border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <span className="font-medium text-destructive">{t("meetings.session.canceled")}</span>{" "}
            {session.cancelReason
              ? t("meetings.session.reason", { reason: isolate(session.cancelReason) })
              : t("meetings.session.noReason")}
          </p>
        ) : null}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <div className="flex min-w-0 flex-col gap-8">
            {attendanceNote ? (
              <Section id="attendance" title={t("nav.attendance")}>
                <p className="text-sm text-muted-foreground">{attendanceNote}</p>
              </Section>
            ) : null}
            {schedule ? (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Repeat className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {t.rich("meetings.session.fromSchedule", {
                    name: schedule.name,
                    pattern: f.recurrence(recurrenceOf(schedule.recurrence)),
                    link: (chunks) => (
                      <Link
                        href={routes.schedule(schedule.id)}
                        className="font-medium text-foreground underline underline-offset-4"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("meetings.session.oneOff")}</p>
            )}
          </div>
          <Section id="history" title={t("meetings.session.history")}>
            <HistoryTimeline entries={data.history} today={today} oneOff={schedule === null} />
          </Section>
        </div>
      </PageBody>
    </>
  )
}

function NotFoundPage() {
  const t = useTranslations("nav")

  return (
    <>
      <Topbar crumbs={[{ label: t("meetings"), href: routes.meetings() }]} />
      <NotFoundState home={routes.meetings()} />
    </>
  )
}

function LoadedSession({ id, actions }: { id: string; actions?: ReactNode }) {
  const query = useMeetingSession(id)

  return (
    <QueryState query={query} notFound={<NotFoundPage />}>
      {(data) => <SessionDetail data={data} actions={actions} />}
    </QueryState>
  )
}

export function SessionPage({ actions }: { actions?: ReactNode }) {
  return (
    <RecordPage notFound={<NotFoundPage />}>
      {(id) => <LoadedSession id={id} actions={actions} />}
    </RecordPage>
  )
}
