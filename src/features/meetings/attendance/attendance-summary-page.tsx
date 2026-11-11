"use client"

import { Info } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ReactNode, useState } from "react"

import { ReasonDialog, ReasonProblem } from "@/components/confirm-dialog"
import { HistoryTimeline } from "@/features/meetings/meetings/history-timeline"
import { MemberAvatar } from "@/components/member-avatar"
import { Section } from "@/components/page-header"
import { RecordPage } from "@/components/record-page"
import { useSessionLines } from "@/features/meetings/meetings/session-lines"
import { Button } from "@/components/ui/button"
import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { useCanIn } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import { isolate } from "@/lib/bidi"
import type { Instant } from "@/lib/api/types/common"
import type { PersonReference } from "@/features/people/members/api"
import { groupOf } from "@/features/meetings/meetings/session-lines"
import { isStale, useRefetch } from "@/lib/api/refetch"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { initials, preferredName } from "@/lib/domain/names"
import { meetingGroup } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { Redirect } from "./redirect"
import { RosterCells } from "./roster-cells"
import {
  ATTENDANCE_QUERIES,
  SESSION_STATUS_QUERIES,
  type AttendanceSheet,
  reopenAttendanceRequest,
} from "./api"
import { SheetState } from "./sheet-state"
import { BoardFrame } from "./take-attendance-page"

function People({ people }: { people: { person: PersonReference; at?: Instant }[] }) {
  const f = useFormat()

  return (
    <ul className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
      {people.map(({ person, at }) => (
        <li key={person.id} className="flex items-center gap-3 border-b py-2">
          <MemberAvatar
            name={preferredName(person)}
            initials={initials(person)}
            seed={person.id}
            className="size-7 text-[11px]"
          />
          <span className="min-w-0 flex-1 truncate text-sm">{preferredName(person)}</span>
          {at ? (
            <span className="text-xs text-muted-foreground tabular-nums">{f.instantTime(at)}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function ReopenButton({ sheet }: { sheet: AttendanceSheet }) {
  const t = useTranslations("attendance.reopen")
  const router = useRouter()
  const refetch = useRefetch()
  const [open, setOpen] = useState(false)
  const id = sheet.session.id

  const reopen = useApiMutation(reopenAttendanceRequest, {
    toastOnError: false,
    invalidate: SESSION_STATUS_QUERIES,
    onSuccess: () => router.push(routes.takeAttendance(id)),
  })

  return (
    <ReasonDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)

        if (!next) {
          reopen.reset()
        }
      }}
      trigger={<Button>{t("button")}</Button>}
      title={t("title", { group: groupOf(sheet.session) })}
      description={t("description")}
      reasonHint={t("hint")}
      placeholder={t("placeholder")}
      confirmLabel={t("confirm")}
      onConfirm={async (reason) => {
        const result = await reopen.execute(id, reason)

        if (!result.ok && isStale(result.problem, ["meetings.onlyCompletedCanReopen"])) {
          void refetch(ATTENDANCE_QUERIES)
        }

        return result.ok
      }}
    >
      <ReasonProblem mutation={reopen} />
    </ReasonDialog>
  )
}

function Corrections({ sheet }: { sheet: AttendanceSheet }) {
  const t = useTranslations("attendance.summary")
  const f = useFormat()

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {sheet.corrections.map((correction) => {
        const { recorded, removed } = correction

        if (!recorded.at || !removed.at) {
          return null
        }

        const values = {
          name: preferredName(correction.person),
          time: f.instantTime(recorded.at),
          when: f.atLabel(removed.at, sheet.today),
          person: (chunks: ReactNode) => <span className="text-foreground">{chunks}</span>,
        }

        const by = removed.by?.name
        const reason = correction.reason ? isolate(correction.reason) : null

        const line = () => {
          if (by && reason) {
            return t.rich("correctionByReason", { ...values, by, reason })
          }

          if (by) {
            return t.rich("correctionBy", { ...values, by })
          }

          return reason
            ? t.rich("correctionReason", { ...values, reason })
            : t.rich("correction", values)
        }

        return (
          <li key={correction.id} className="text-muted-foreground">
            {line()}
          </li>
        )
      })}
    </ul>
  )
}

function Summary({ sheet }: { sheet: AttendanceSheet }) {
  const t = useTranslations("attendance.summary")
  const f = useFormat()
  const lines = useSessionLines()
  const { session, counts } = sheet
  const expected = session.rosterMode === "expected" && counts.rosterSize !== null

  const present = expected
    ? sheet.roster.flatMap((row) =>
        row.mark ? [{ person: row.person, at: row.mark.recordedAt }] : []
      )
    : sheet.notOnRoster.map((row) => ({ person: row.person, at: row.mark.recordedAt }))

  const notMarked = sheet.roster.filter((row) => !row.mark).map((row) => ({ person: row.person }))

  const closedWhen = session.closedAt ? f.atLabel(session.closedAt, sheet.today) : null

  const closedLine = () => {
    if (!closedWhen) {
      return null
    }

    return session.closedBy
      ? t("closedAtBy", { when: closedWhen, name: session.closedBy.name })
      : t("closedAt", { when: closedWhen })
  }

  const closed = closedLine()

  return (
    <>
      <div className="flex flex-col gap-4 border p-5 md:flex-row md:items-center md:gap-8">
        <div className="flex shrink-0 flex-col">
          <span className="font-heading text-4xl font-semibold tabular-nums">
            {expected ? counts.rosterPresent : counts.present}
          </span>
          <span className="text-sm text-muted-foreground">
            {expected ? t("ofRoster", { total: counts.rosterSize ?? 0 }) : t("present")}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {expected && counts.rosterSize ? (
            <RosterCells
              filled={counts.rosterPresent}
              total={counts.rosterSize}
              extra={counts.notOnRoster}
              size="lg"
            />
          ) : null}
          <span className="text-sm text-muted-foreground" data-testid="summary-line">
            {lines.present({ ...session, counts })}
            {closed ? ` · ${closed}` : ""}
          </span>
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="flex min-w-0 flex-col gap-10">
          <Section id="present" title={t("presentTitle", { count: present.length })}>
            {present.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("nobodyPresent")}</p>
            ) : (
              <People people={present} />
            )}
          </Section>
          {expected && sheet.notOnRoster.length > 0 ? (
            <Section
              id="extra"
              title={t("extraTitle", { count: sheet.notOnRoster.length })}
              description={t("extraDescription")}
            >
              <People
                people={sheet.notOnRoster.map((row) => ({
                  person: row.person,
                  at: row.mark.recordedAt,
                }))}
              />
            </Section>
          ) : null}
          {expected ? (
            <Section id="not-marked" title={t("notMarkedTitle", { count: notMarked.length })}>
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t("notMarkedNote")}
              </p>
              {notMarked.length === 0 ? (
                <p className="text-sm">{t("everyoneMarked")}</p>
              ) : (
                <People people={notMarked} />
              )}
            </Section>
          ) : null}
          {sheet.corrections.length > 0 ? (
            <Section id="corrections" title={t("corrections")}>
              <Corrections sheet={sheet} />
            </Section>
          ) : null}
        </div>
        <Section id="history" title={t("history")}>
          <HistoryTimeline
            entries={sheet.history}
            today={sheet.today}
            oneOff={session.scheduleId === null}
          />
        </Section>
      </div>
    </>
  )
}

function SummaryActions({ sheet }: { sheet: AttendanceSheet }) {
  const t = useTranslations("attendance.summary")
  const can = useCanIn(meetingGroup(sheet.session))
  const { session } = sheet

  return (
    <div className="flex flex-wrap gap-2">
      {session.status === "completed" && can("update", "sessions") ? (
        <ReopenButton sheet={sheet} />
      ) : null}
      {session.status === "active" && can("create", "attendance") ? (
        <Button asChild>
          <Link href={routes.takeAttendance(session.id)}>{t("continue")}</Link>
        </Button>
      ) : null}
    </div>
  )
}

function LoadedSummary({ id }: { id: string }) {
  return (
    <SheetState id={id} notFound={<RecordNotFound area="attendance" />}>
      {(sheet) =>
        sheet.session.status === "scheduled" || sheet.session.status === "canceled" ? (
          <Redirect to={routes.takeAttendance(id)} />
        ) : (
          <BoardFrame sheet={sheet}>
            <SummaryActions sheet={sheet} />
            <Summary sheet={sheet} />
          </BoardFrame>
        )
      }
    </SheetState>
  )
}

export function AttendanceSummaryPage() {
  return (
    <RecordPage param="session" notFound={<RecordNotFound area="attendance" />}>
      {(id) => <LoadedSummary id={id} />}
    </RecordPage>
  )
}
