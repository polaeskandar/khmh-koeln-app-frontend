"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Eraser } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useSession } from "@/features/identity/auth/session"
import { isStale, useRefetch } from "@/lib/api/refetch"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"

import {
  type DataRequestDetail,
  eraseRequest,
  type ErasureReview,
  subjectGone,
  DATA_REQUEST_QUERIES,
} from "./api"
import { useEraseLines } from "./erase-lines"

export function useEraseBlockReason(detail: DataRequestDetail) {
  const t = useTranslations()
  const { session } = useSession()
  const ownAccountId = session.status === "authenticated" ? session.me.account.id : null

  if (detail.account !== null && detail.account.id === ownAccountId) {
    return t("privacy.detail.ownAccount")
  }

  if (subjectGone(detail)) {
    return t("errors.privacy.subjectGone")
  }

  return null
}

export function EraseAction({
  detail,
  review,
  name,
}: {
  detail: DataRequestDetail
  review: ErasureReview | undefined
  name: string
}) {
  const t = useTranslations()
  const queryClient = useQueryClient()
  const refetch = useRefetch()
  const eraseLines = useEraseLines()
  const [open, setOpen] = useState(false)
  const mentions = review?.mentions.length ?? 0
  const [clearNotes, setClearNotes] = useState(true)

  const erase = useApiMutation((clear: boolean) => eraseRequest(detail.request.id, clear), {
    onSuccess: () => queryClient.invalidateQueries(),
  })

  return (
    <>
      <Button variant="destructive" disabled={!review} onClick={() => setOpen(true)}>
        <Eraser data-icon="inline-start" />
        {t("privacy.actions.erase")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        tone="destructive"
        title={t("privacy.actions.eraseTitle", { name: isolate(name) })}
        description={t("privacy.actions.eraseDescription")}
        consequences={[...eraseLines(review?.erase ?? {}), t("privacy.actions.eraseKeeps")]}
        note={
          mentions > 0 ? (
            <label className="flex cursor-pointer items-center gap-2 text-foreground">
              <Checkbox
                checked={clearNotes}
                onCheckedChange={(checked) => setClearNotes(checked === true)}
              />
              {t("privacy.actions.clearNotes", { count: mentions })}
            </label>
          ) : undefined
        }
        confirmLabel={t("privacy.actions.eraseConfirm")}
        onConfirm={async () => {
          const result = await erase.execute(mentions > 0 && clearNotes)

          if (!result.ok && isStale(result.problem, [409])) {
            void refetch(DATA_REQUEST_QUERIES)

            return true
          }

          return result.ok
        }}
      />
    </>
  )
}
