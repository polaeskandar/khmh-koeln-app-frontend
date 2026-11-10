"use client"

import { useQueryClient } from "@tanstack/react-query"
import { CircleAlert, Info } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ReactNode, useEffect, useState } from "react"

import { ReasonDialog } from "@/components/confirm-dialog"
import { HistoryTimeline } from "@/components/history-timeline"
import { MemberAvatar } from "@/components/member-avatar"
import { NotFoundState } from "@/components/page-states"
import { Section } from "@/components/page-header"
import { RecordPage } from "@/components/record-page"
import { RosterCells } from "@/components/roster-cells"
import { useSessionLines } from "@/components/session-bits"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Topbar } from "@/components/app-shell/topbar"
import { useCanIn } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import { isolate } from "@/lib/bidi"
import type { Instant, PersonRef } from "@/lib/api/types/common"
import { groupOf } from "@/lib/api/types/meetings"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { initials, preferredName } from "@/lib/domain/names"
import { meetingGroup } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { type AttendanceSheet as Board, reopenAttendanceRequest } from "./api"
import { SheetState } from "./sheet-state"
import { BoardFrame } from "./take-attendance-page"

function People({ people }: { people: { person: PersonRef; at?: Instant }[] }) {
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

function ReopenButton({ board }: { board: Board }) {
  const t = useTranslations("attendance.reopen")
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const id = board.session.id

  const reopen = useApiMutation(reopenAttendanceRequest, {
    toastOnError: false,
    invalidate: [["attendance"], ["sessions"]],
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
      title={t("title", { group: groupOf(board.session) })}
      description={t("description")}
      reasonHint={t("hint")}
      placeholder={t("placeholder")}
      confirmLabel={t("confirm")}
      onConfirm={async (reason) => {
        const result = await reopen.execute(id, reason)

        if (!result.ok && result.problem.code === "meetings.onlyCompletedCanReopen") {
          void queryClient.invalidateQueries({ queryKey: ["attendance"] })
          void queryClient.invalidateQueries({ queryKey: ["sessions"] })
        }

        return result.ok
      }}
    >
      {reopen.problem ? (
        <Alert variant="destructive" role="alert">
          <CircleAlert />
          <AlertDescription>{reopen.fieldErrors.reason ?? reopen.problem.message}</AlertDescription>
        </Alert>
      ) : null}
    </ReasonDialog>
  )
}

function Corrections({ board }: { board: Board }) {
  const t = useTranslations("attendance.summary")
  const f = useFormat()

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {board.corrections.map((correction) => {
        const { recorded, removed } = correction

        if (!recorded.at || !removed.at) {
          return null
        }

        const values = {
          name: preferredName(correction.person),
          time: f.instantTime(recorded.at),
          when: f.atLabel(removed.at, board.today),
          person: (chunks: ReactNode) => <span className="text-foreground">{chunks}</span>,
        }

        const by = removed.by?.name
        const reason = correction.reason ? isolate(correction.reason) : null

        return (
          <li key={correction.id} className="text-muted-foreground">
            {by && reason
              ? t.rich("correctionByReason", { ...values, by, reason })
              : by
                ? t.rich("correctionBy", { ...values, by })
                : reason
                  ? t.rich("correctionReason", { ...values, reason })
                  : t.rich("correction", values)}
          </li>
        )
      })}
    </ul>
  )
}

function Summary({ board }: { board: Board }) {
  const t = useTranslations("attendance.summary")
  const f = useFormat()
  const lines = useSessionLines()
  const { session, counts } = board
  const expected = session.rosterMode === "expected" && counts.rosterSize !== null

  const present = expected
    ? board.roster.flatMap((row) =>
        row.mark ? [{ person: row.person, at: row.mark.recordedAt }] : []
      )
    : board.notOnRoster.map((row) => ({ person: row.person, at: row.mark.recordedAt }))

  const notMarked = board.roster.filter((row) => !row.mark).map((row) => ({ person: row.person }))

  const closed = session.closedAt
    ? session.closedBy
      ? t("closedAtBy", {
          when: f.atLabel(session.closedAt, board.today),
          name: session.closedBy.name,
        })
      : t("closedAt", { when: f.atLabel(session.closedAt, board.today) })
    : null

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
          {expected && board.notOnRoster.length > 0 ? (
            <Section
              id="extra"
              title={t("extraTitle", { count: board.notOnRoster.length })}
              description={t("extraDescription")}
            >
              <People
                people={board.notOnRoster.map((row) => ({
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
          {board.corrections.length > 0 ? (
            <Section id="corrections" title={t("corrections")}>
              <Corrections board={board} />
            </Section>
          ) : null}
        </div>
        <Section id="history" title={t("history")}>
          <HistoryTimeline
            entries={board.history}
            today={board.today}
            oneOff={session.scheduleId === null}
          />
        </Section>
      </div>
    </>
  )
}

function SummaryActions({ board }: { board: Board }) {
  const t = useTranslations("attendance.summary")
  const can = useCanIn(meetingGroup(board.session))
  const { session } = board

  return (
    <div className="flex flex-wrap gap-2">
      {session.status === "completed" && can("update", "sessions") ? (
        <ReopenButton board={board} />
      ) : null}
      {session.status === "active" && can("create", "attendance") ? (
        <Button asChild>
          <Link href={routes.takeAttendance(session.id)}>{t("continue")}</Link>
        </Button>
      ) : null}
    </div>
  )
}

function ToBoard({ session }: { session: string }) {
  const router = useRouter()
  useEffect(() => router.replace(routes.takeAttendance(session)), [router, session])

  return null
}

function NotFoundPage() {
  const t = useTranslations("nav")

  return (
    <>
      <Topbar crumbs={[{ label: t("attendance"), href: routes.attendance() }]} />
      <NotFoundState home={routes.attendance()} />
    </>
  )
}

function LoadedSummary({ id }: { id: string }) {
  return (
    <SheetState id={id} notFound={<NotFoundPage />}>
      {(board) =>
        board.session.status === "scheduled" || board.session.status === "canceled" ? (
          <ToBoard session={id} />
        ) : (
          <BoardFrame board={board}>
            <SummaryActions board={board} />
            <Summary board={board} />
          </BoardFrame>
        )
      }
    </SheetState>
  )
}

export function AttendanceSummaryPage() {
  return (
    <RecordPage param="session" notFound={<NotFoundPage />}>
      {(id) => <LoadedSummary id={id} />}
    </RecordPage>
  )
}
