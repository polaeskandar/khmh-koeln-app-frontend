"use client"

import { useTranslations } from "next-intl"
import { type ReactNode, useEffect, useState } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader } from "@/components/page-header"
import { NotFoundState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { ServiceTag } from "@/components/service-tag"
import { SessionBadges, SessionWhen } from "@/components/session-bits"
import { Button } from "@/components/ui/button"
import { useCan } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import { groupOf } from "@/lib/api/types/meetings"
import { routes } from "@/lib/routes"

import type { AttendanceSheet as Board } from "./api"
import { AttendanceBoard } from "./attendance-board"
import { CloseDialog, CorrectionDialog } from "./board-dialogs"
import { applyWrites, useMarkWrites, useOnline } from "./mark-writes"
import { OpenAttendanceButton } from "./open-attendance-button"
import { SheetState } from "./sheet-state"
import { VisitorSearch } from "./visitor-search"

export function BoardFrame({ board, children }: { board: Board; children: ReactNode }) {
  const t = useTranslations()
  const f = useFormat()
  const { session } = board

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
          <SessionWhen item={session} today={board.today} className="mt-1" />
        </PageHeader>
        {children}
      </PageBody>
    </>
  )
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

function ActiveBoard({ board, boardAt }: { board: Board; boardAt: number }) {
  const t = useTranslations("attendance.board")
  const can = useCan()
  const online = useOnline()
  const writes = useMarkWrites(board.session.id)
  const shown = applyWrites(board, writes.writes, boardAt)
  const [dialog, setDialog] = useState<"close" | "correct" | null>(null)

  return (
    <>
      {online ? null : (
        <p role="alert" className="border border-warning/40 bg-warning-soft p-3 text-sm">
          {t("offline")}
        </p>
      )}
      <AttendanceBoard
        board={shown}
        actions={{
          onMark: writes.mark,
          onUndo: writes.undo,
          onClose: () => setDialog("close"),
          onCorrect: () => setDialog("correct"),
          pending: writes.pending,
          saving: writes.pending.size > 0,
        }}
        below={(query) =>
          can("create", "attendance") ? (
            <VisitorSearch
              board={shown}
              query={query}
              pending={writes.pending}
              onMark={writes.markVisitor}
            />
          ) : null
        }
      />
      <CloseDialog
        board={shown}
        open={dialog === "close"}
        onOpenChange={(open) => setDialog(open ? "close" : null)}
      />
      <CorrectionDialog
        board={shown}
        open={dialog === "correct"}
        onOpenChange={(open) => setDialog(open ? "correct" : null)}
      />
    </>
  )
}

function NotOpen({ board }: { board: Board }) {
  const t = useTranslations("attendance.session")
  const f = useFormat()
  const can = useCan()
  const records = can("create", "attendance")
  const { session, today } = board
  const due = session.date <= today

  return (
    <div className="flex flex-col items-start gap-3 border border-dashed p-6">
      <h2 className="font-heading text-lg font-semibold">{t("notOpen")}</h2>
      <p className="max-w-prose text-sm text-muted-foreground">
        {!due
          ? t("opensOn", { date: f.longDate(session.date) })
          : records
            ? t("openWhenStarts")
            : t("servantsOpen")}
      </p>
      {due && records ? <OpenAttendanceButton session={session.id} /> : null}
    </div>
  )
}

function Canceled({ board }: { board: Board }) {
  const t = useTranslations("attendance.session")

  return (
    <div className="flex flex-col gap-2 border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <p className="font-medium text-destructive">{t("canceled")}</p>
      {board.session.cancelReason ? <p dir="auto">{board.session.cancelReason}</p> : null}
      <p className="text-muted-foreground">{t("noAttendance")}</p>
    </div>
  )
}

function ToSummary({ session }: { session: string }) {
  const router = useRouter()
  useEffect(() => router.replace(routes.attendanceSummary(session)), [router, session])

  return null
}

function LoadedBoard({ id }: { id: string }) {
  return (
    <SheetState id={id} live notFound={<NotFoundPage />}>
      {(board, boardAt) => (
        <BoardFrame board={board}>
          {board.session.status === "active" ? (
            <ActiveBoard key={board.session.id} board={board} boardAt={boardAt} />
          ) : board.session.status === "scheduled" ? (
            <NotOpen board={board} />
          ) : board.session.status === "canceled" ? (
            <Canceled board={board} />
          ) : (
            <ToSummary session={board.session.id} />
          )}
        </BoardFrame>
      )}
    </SheetState>
  )
}

export function TakeAttendancePage() {
  return (
    <RecordPage param="session" notFound={<NotFoundPage />}>
      {(id) => <LoadedBoard id={id} />}
    </RecordPage>
  )
}
