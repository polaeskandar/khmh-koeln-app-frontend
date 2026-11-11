"use client"

import { useTranslations } from "next-intl"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { useRouter } from "@/i18n/navigation"
import { groupOf } from "@/features/meetings/meetings/session-lines"
import { isStale, useRefetch } from "@/lib/api/refetch"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import {
  ATTENDANCE_QUERIES,
  SESSION_STATUS_QUERIES,
  type AttendanceSheet,
  closeAttendanceRequest,
} from "./api"

export function CloseDialog({
  board,
  open,
  onOpenChange,
}: {
  board: AttendanceSheet
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const refetch = useRefetch()
  const { session, counts } = board
  const expected = session.rosterMode === "expected"
  const rosterSize = board.roster.length
  const notMarked = rosterSize - counts.rosterPresent

  const close = useApiMutation(closeAttendanceRequest, {
    successMessage: t("attendance.toast.closed"),
    invalidate: SESSION_STATUS_QUERIES,
    onSuccess: () => router.replace(routes.attendanceSummary(session.id)),
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("attendance.board.confirm.title", { group: groupOf(session) })}
      description={t("attendance.board.confirm.description")}
      consequences={[
        expected
          ? t("attendance.board.confirm.presentOf", {
              present: counts.rosterPresent,
              total: rosterSize,
            })
          : t("attendance.board.confirm.present", { count: counts.present }),
        ...(expected && counts.notOnRoster
          ? [t("attendance.board.confirm.extra", { count: counts.notOnRoster })]
          : []),
        ...(expected && notMarked > 0
          ? [t("attendance.board.confirm.notMarked", { count: notMarked })]
          : []),
      ]}
      confirmLabel={t("attendance.board.close")}
      onConfirm={async () => {
        const result = await close.execute(session.id)

        if (!result.ok && isStale(result.problem, ["meetings.onlyActiveCanClose"])) {
          void refetch(ATTENDANCE_QUERIES)
        }

        return result.ok
      }}
    />
  )
}
