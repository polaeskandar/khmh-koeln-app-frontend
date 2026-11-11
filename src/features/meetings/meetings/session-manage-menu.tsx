"use client"

import { CalendarX2, Ellipsis } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ReasonDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFormat } from "@/i18n/format"
import { groupOf } from "./session-lines"
import type { SessionView } from "./api"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { cancelSessionRequest, SCHEDULE_QUERIES } from "./api"

export function SessionManageMenu({ session }: { session: SessionView }) {
  const t = useTranslations()
  const f = useFormat()
  const [canceling, setCanceling] = useState(false)

  const cancel = useApiMutation(cancelSessionRequest, {
    toastOnError: false,
    successMessage: t("toast.sessionCanceled"),
    invalidate: SCHEDULE_QUERIES,
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Ellipsis data-icon="inline-start" />
            {t("meetings.dialogs.sessionMenu")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onSelect={() => setCanceling(true)}>
            <CalendarX2 />
            {t("meetings.dialogs.cancelSession")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ReasonDialog
        key={canceling ? "open" : "closed"}
        open={canceling}
        onOpenChange={(open) => {
          setCanceling(open)

          if (!open) {
            cancel.reset()
          }
        }}
        title={t("meetings.dialogs.cancelTitle", {
          group: groupOf(session),
          date: f.longDate(session.date),
        })}
        description={t("meetings.dialogs.cancelSessionDescription")}
        reasonHint={t("meetings.dialogs.cancelReasonHint")}
        placeholder={t("meetings.dialogs.cancelReasonPlaceholder")}
        confirmLabel={t("meetings.dialogs.confirmCancelSession")}
        dismissLabel={t("meetings.dialogs.keepSession")}
        tone="destructive"
        onConfirm={async (reason) => (await cancel.execute(session.id, reason)).ok}
      >
        {cancel.problem ? (
          <p role="alert" className="text-sm text-destructive">
            {cancel.fieldErrors.reason ?? cancel.problem.message}
          </p>
        ) : null}
      </ReasonDialog>
    </>
  )
}
