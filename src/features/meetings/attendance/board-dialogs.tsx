"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ConfirmDialog, ReasonDialog } from "@/components/confirm-dialog"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useFormat } from "@/i18n/format"
import { useRouter } from "@/i18n/navigation"
import type { PersonRef } from "@/lib/api/types/common"
import { groupOf } from "@/lib/api/types/meetings"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { preferredName } from "@/lib/domain/names"
import { routes } from "@/lib/routes"

import {
  type AttendanceBoard,
  type AttendanceSheet,
  closeAttendanceRequest,
  type Mark,
  removeMarkRequest,
} from "./api"

const SESSION_QUERIES = [["attendance"], ["sessions"], ["agenda"], ["dashboard"]]

const STATE_QUERIES = [["attendance"], ["sessions"]]

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
  const queryClient = useQueryClient()
  const { session, counts } = board
  const expected = session.rosterMode === "expected"
  const rosterSize = board.roster.length
  const notMarked = rosterSize - counts.rosterPresent

  const close = useApiMutation(closeAttendanceRequest, {
    successMessage: t("toast.attendanceClosed"),
    invalidate: SESSION_QUERIES,
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

        if (!result.ok && result.problem.code === "meetings.onlyActiveCanClose") {
          STATE_QUERIES.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }))
        }

        return result.ok
      }}
    />
  )
}

function marksOf(board: AttendanceBoard): { person: PersonRef; mark: Mark }[] {
  return [...board.roster, ...board.notOnRoster]
    .flatMap((row) => (row.mark?.id ? [{ person: row.person, mark: row.mark }] : []))
    .sort((a, b) => b.mark.recordedAt.localeCompare(a.mark.recordedAt))
}

export function CorrectionDialog({
  board,
  open,
  onOpenChange,
}: {
  board: AttendanceSheet
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("attendance.board")
  const f = useFormat()
  const queryClient = useQueryClient()
  const marks = marksOf(board)
  const [chosen, setChosen] = useState<string | null>(null)

  if (open && chosen === null && marks[0]) {
    setChosen(marks[0].person.id)
  }

  const personId = chosen ?? marks[0]?.person.id ?? ""
  const remove = useApiMutation(removeMarkRequest, { toastOnError: false })

  return (
    <ReasonDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)

        if (!next) {
          setChosen(null)
          remove.reset()
        }
      }}
      title={t("correct.title")}
      description={t("correct.description")}
      reasonLabel={t("correct.note")}
      placeholder={t("correct.placeholder")}
      confirmLabel={t("correct.confirm")}
      tone="destructive"
      onConfirm={async (reason) => {
        const result = await remove.execute(board.session.id, personId, reason)

        if (result.ok || result.problem.code === "attendance.closedReopen") {
          STATE_QUERIES.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }))
        }

        return result.ok
      }}
    >
      <NativeSelect
        aria-label={t("correct.person")}
        className="w-full"
        value={personId}
        onChange={(event) => setChosen(event.target.value)}
      >
        {marks.map(({ person, mark }) => (
          <NativeSelectOption key={person.id} value={person.id}>
            {preferredName(person)} · {f.instantTime(mark.recordedAt)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {remove.problem ? (
        <p role="alert" className="text-sm text-destructive">
          {remove.fieldErrors.reason ?? remove.problem.message}
        </p>
      ) : null}
    </ReasonDialog>
  )
}
