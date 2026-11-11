"use client"

import { useTranslations } from "next-intl"
import { type ReactNode, useState } from "react"

import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { Redirect } from "./redirect"
import { Topbar } from "@/features/portals/staff/topbar"
import { DialogMount } from "@/components/dialog-mount"
import { PageBody, PageHeader } from "@/components/page-header"
import { RecordPage } from "@/components/record-page"
import { ServiceTag } from "@/components/service-tag"
import { SessionBadges } from "@/features/meetings/meetings/session-badges"
import { SessionWhen } from "@/features/meetings/meetings/session-when"
import { Button } from "@/components/ui/button"
import { useCanIn } from "@/features/identity/auth/session"
import { useOnline } from "@/hooks/use-online"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import { groupOf } from "@/features/meetings/meetings/session-lines"
import { meetingGroup } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import type { AttendanceSheet } from "./api"
import { AttendanceBoard } from "./attendance-board"
import { CloseDialog } from "./close-dialog"
import { CorrectionDialog } from "./correction-dialog"
import { applyWrites, useMarkWrites } from "./mark-writes"
import { isDue } from "./next-step"
import { OpenAttendanceButton } from "./open-attendance-button"
import { SheetState } from "./sheet-state"
import { VisitorSearch } from "./visitor-search"

export function BoardFrame({ sheet, children }: { sheet: AttendanceSheet; children: ReactNode }) {
  const t = useTranslations()
  const f = useFormat()
  const { session } = sheet

  return (
    <>
      <Topbar
        crumbs={[
          { label: t("nav.attendance"), href: routes.attendance() },
          { label: groupOf(session) },
        ]}
      />
      <PageBody className="gap-4 md:gap-6">
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
            <Button variant="ghost" asChild>
              <Link href={routes.session(session.id)}>{t("attendance.sessionDetails")}</Link>
            </Button>
          }
          actionsClassName="hidden md:flex"
        >
          <SessionWhen item={session} className="mt-1" />
        </PageHeader>
        {children}
      </PageBody>
    </>
  )
}

function ActiveBoard({ sheet, boardAt }: { sheet: AttendanceSheet; boardAt: number }) {
  const t = useTranslations("attendance.board")
  const can = useCanIn(meetingGroup(sheet.session))
  const online = useOnline()
  const writes = useMarkWrites(sheet.session.id)
  const shown = applyWrites(sheet, writes.writes, boardAt)
  const [dialog, setDialog] = useState<"close" | "correct" | null>(null)

  return (
    <>
      {online ? null : (
        <p role="alert" className="border border-warning/40 bg-warning-soft p-3 text-sm">
          {t("offline")}
        </p>
      )}
      <AttendanceBoard
        sheet={shown}
        actions={{
          onMark: writes.mark,
          onUndo: writes.undo,
          onClose: () => setDialog("close"),
          onCorrect: () => setDialog("correct"),
          pending: writes.pending,
          saving: writes.pending.size > 0,
        }}
        below={(searchText) =>
          can("create", "attendance") ? (
            <VisitorSearch
              sheet={shown}
              searchText={searchText}
              pending={writes.pending}
              onMark={writes.markVisitor}
            />
          ) : null
        }
      />
      <CloseDialog
        sheet={shown}
        open={dialog === "close"}
        onOpenChange={(open) => setDialog(open ? "close" : null)}
      />
      <DialogMount open={dialog === "correct"}>
        <CorrectionDialog
          sheet={shown}
          open={dialog === "correct"}
          onOpenChange={(open) => setDialog(open ? "correct" : null)}
        />
      </DialogMount>
    </>
  )
}

function NotOpen({ sheet }: { sheet: AttendanceSheet }) {
  const t = useTranslations("attendance.session")
  const f = useFormat()
  const can = useCanIn(meetingGroup(sheet.session))
  const records = can("create", "attendance")
  const { session, today } = sheet
  const due = isDue(session, today)
  const past = session.date < today
  const onTheDay = records ? t("openWhenStarts") : t("servantsOpen")
  const afterTheDay = records ? t("openNow") : t("servantsCanStillOpen")

  return (
    <div className="flex flex-col items-start gap-3 border border-dashed p-6">
      <h2 className="font-heading text-lg font-semibold">{past ? t("notTaken") : t("notOpen")}</h2>
      <p className="max-w-prose text-sm text-muted-foreground">
        {!due ? t("opensOn", { date: f.longDate(session.date) }) : past ? afterTheDay : onTheDay}
      </p>
      {due && records ? <OpenAttendanceButton sessionId={session.id} /> : null}
    </div>
  )
}

function Canceled({ sheet }: { sheet: AttendanceSheet }) {
  const t = useTranslations("attendance.session")

  return (
    <div className="flex flex-col gap-2 border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <p className="font-medium text-destructive">{t("canceled")}</p>
      {sheet.session.cancelReason ? <p dir="auto">{sheet.session.cancelReason}</p> : null}
      <p className="text-muted-foreground">{t("noAttendance")}</p>
    </div>
  )
}

function LoadedBoard({ id }: { id: string }) {
  return (
    <SheetState id={id} live notFound={<RecordNotFound area="attendance" />}>
      {(sheet, boardAt) => (
        <BoardFrame sheet={sheet}>
          {sheet.session.status === "active" ? (
            <ActiveBoard key={sheet.session.id} sheet={sheet} boardAt={boardAt} />
          ) : sheet.session.status === "scheduled" ? (
            <NotOpen sheet={sheet} />
          ) : sheet.session.status === "canceled" ? (
            <Canceled sheet={sheet} />
          ) : (
            <Redirect to={routes.attendanceSummary(sheet.session.id)} />
          )}
        </BoardFrame>
      )}
    </SheetState>
  )
}

export function TakeAttendancePage() {
  return (
    <RecordPage param="session" notFound={<RecordNotFound area="attendance" />}>
      {(id) => <LoadedBoard id={id} />}
    </RecordPage>
  )
}
