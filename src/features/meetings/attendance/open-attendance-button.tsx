"use client"

import { LockOpen } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { isStale, useRefetch } from "@/lib/api/refetch"
import type { Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { SESSION_STATUS_QUERIES, openAttendanceRequest } from "./api"

const CHANGED_MEANWHILE = [
  "meetings.opensOnTheDay",
  "meetings.sessionCanceled",
  "meetings.attendanceClosed",
]

export function OpenAttendanceButton({
  sessionId,
  onOpened,
}: {
  sessionId: Uuid
  onOpened?: () => void
}) {
  const t = useTranslations("attendance")
  const refetch = useRefetch()

  const open = useApiMutation(openAttendanceRequest, {
    invalidate: SESSION_STATUS_QUERIES,
    onSuccess: onOpened,
  })

  return (
    <Button
      disabled={open.pending}
      onClick={async () => {
        const result = await open.execute(sessionId)

        if (!result.ok && isStale(result.problem, CHANGED_MEANWHILE)) {
          void refetch(SESSION_STATUS_QUERIES)
        }
      }}
    >
      {open.pending ? <Spinner data-icon="inline-start" /> : <LockOpen data-icon="inline-start" />}
      {t("open")}
    </Button>
  )
}
