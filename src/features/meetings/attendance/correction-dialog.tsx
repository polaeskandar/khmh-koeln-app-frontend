"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { ReasonDialog } from "@/components/confirm-dialog"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useFormat } from "@/i18n/format"
import type { PersonRef } from "@/lib/api/types/common"
import { isStale, useRefetch } from "@/lib/api/refetch"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { preferredName } from "@/lib/domain/names"

import {
  ATTENDANCE_QUERIES,
  type AttendanceBoard,
  type AttendanceSheet,
  type Mark,
  removeMarkRequest,
} from "./api"

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
  const refetch = useRefetch()
  const marks = marksOf(board)
  const [chosen, setChosen] = useState<string | null>(null)

  if (open && chosen === null && marks[0]) {
    setChosen(marks[0].person.id)
  }

  const personId = chosen ?? marks[0]?.person.id ?? ""

  const remove = useApiMutation(removeMarkRequest, {
    toastOnError: false,
    invalidate: ATTENDANCE_QUERIES,
  })

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

        if (!result.ok && isStale(result.problem, ["attendance.closedReopen"])) {
          void refetch(ATTENDANCE_QUERIES)
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
