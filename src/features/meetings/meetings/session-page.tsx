"use client"

import { useQuery } from "@tanstack/react-query"
import { ClipboardCheck, Repeat } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { RecordNotFound } from "@/components/app-shell/record-not-found"
import { Topbar } from "@/components/app-shell/topbar"
import { HistoryTimeline } from "./history-timeline"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { ServiceTag } from "@/components/service-tag"
import { SessionBadges } from "./session-badges"
import { SessionWhen } from "./session-when"
import { Button } from "@/components/ui/button"
import { useCanIn } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import { isolate } from "@/lib/bidi"
import { recurrenceOf } from "@/lib/domain/recurrence"
import type { LocalDate } from "@/lib/api/types/common"
import { groupOf } from "./session-lines"
import type { SessionView } from "@/lib/api/types/meetings"
import { meetingGroup } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { OpenAttendanceButton } from "@/features/meetings/attendance/open-attendance-button"

import { type MeetingSession, meetingSessionQuery } from "./api"
import { SessionManageMenu } from "./session-manage-menu"

function AttendanceAction({ session, today }: { session: SessionView; today: LocalDate }) {
  const t = useTranslations()
  const router = useRouter()
  const can = useCanIn(meetingGroup(session))
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
  const { session, schedule, today } = data
  const can = useCanIn(meetingGroup(session))
  const canceled = session.status === "canceled"

  const attendanceNote = canceled
    ? t("meetings.session.noAttendance")
    : session.status !== "scheduled"
      ? null
      : session.date < today
        ? t("meetings.session.notTaken")
        : session.date === today
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
          <SessionWhen item={session} className="mt-1" />
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

function LoadedSession({ id, actions }: { id: string; actions?: ReactNode }) {
  const query = useQuery(meetingSessionQuery(id))

  return (
    <QueryState query={query} notFound={<RecordNotFound area="meetings" />}>
      {(data) => <SessionDetail data={data} actions={actions} />}
    </QueryState>
  )
}

export function SessionPage({ actions }: { actions?: ReactNode }) {
  return (
    <RecordPage notFound={<RecordNotFound area="meetings" />}>
      {(id) => <LoadedSession id={id} actions={actions} />}
    </RecordPage>
  )
}
