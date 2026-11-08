"use client"

import { useQueryClient } from "@tanstack/react-query"
import { LockOpen } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { openAttendanceRequest } from "@/features/meetings/attendance/api"

const REFETCH_CODES = new Set([
  "meetings.opensOnTheDay",
  "meetings.sessionCanceled",
  "meetings.attendanceClosed",
])

const SESSION_QUERIES = [["attendance"], ["sessions"], ["agenda"]]

export function OpenAttendanceButton({
  session,
  onOpened,
}: {
  session: Uuid
  onOpened?: () => void
}) {
  const t = useTranslations("attendance")
  const queryClient = useQueryClient()

  const refetch = () =>
    SESSION_QUERIES.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }))

  const open = useApiMutation(openAttendanceRequest, {
    invalidate: SESSION_QUERIES,
    onSuccess: onOpened,
  })

  return (
    <Button
      disabled={open.pending}
      onClick={async () => {
        const result = await open.execute(session)

        if (!result.ok && result.problem.code && REFETCH_CODES.has(result.problem.code)) {
          refetch()
        }
      }}
    >
      {open.pending ? <Spinner data-icon="inline-start" /> : <LockOpen data-icon="inline-start" />}
      {t("open")}
    </Button>
  )
}
