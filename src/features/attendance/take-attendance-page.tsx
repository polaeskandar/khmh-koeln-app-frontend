"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader } from "@/components/page-header"
import { NotFoundState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { ServiceTag } from "@/components/service-tag"
import { SessionBadges, SessionWhen } from "@/components/session-bits"
import { Button } from "@/components/ui/button"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import { groupOf } from "@/lib/api/types/meetings"
import { routes } from "@/lib/routes"

import { type AttendanceBoard as Board, attendanceBoardQuery } from "./api"
import { AttendanceBoard } from "./attendance-board"
import { applyWrites, useMarkWrites, useOnline } from "./mark-writes"
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
  const online = useOnline()
  const writes = useMarkWrites(board.session.id)
  const shown = applyWrites(board, writes.writes, boardAt)

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
          pending: writes.pending,
          saving: writes.pending.size > 0,
        }}
        below={(query) =>
          board.session.can.record ? (
            <VisitorSearch
              board={shown}
              query={query}
              pending={writes.pending}
              onMark={writes.markVisitor}
            />
          ) : null
        }
      />
    </>
  )
}

function LoadedBoard({ id }: { id: string }) {
  const query = useQuery({
    ...attendanceBoardQuery(id),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  return (
    <QueryState query={query} notFound={<NotFoundPage />}>
      {(board) => (
        <BoardFrame board={board}>
          {board.session.status === "active" ? (
            <ActiveBoard board={board} boardAt={query.dataUpdatedAt} />
          ) : null}
        </BoardFrame>
      )}
    </QueryState>
  )
}

export function TakeAttendancePage() {
  return (
    <RecordPage param="session" notFound={<NotFoundPage />}>
      {(id) => <LoadedBoard id={id} />}
    </RecordPage>
  )
}
