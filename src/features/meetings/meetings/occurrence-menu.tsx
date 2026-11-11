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
import type { PlannedItem } from "@/lib/api/types/meetings"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { cancelOccurrenceRequest, SCHEDULE_QUERIES } from "./api"

export function OccurrenceMenu({ item }: { item: PlannedItem }) {
  const t = useTranslations()
  const f = useFormat()
  const [canceling, setCanceling] = useState(false)
  const day = f.longDate(item.date).replace(/ \d{4}$/, "")

  const cancel = useApiMutation(cancelOccurrenceRequest, {
    toastOnError: false,
    successMessage: t("toast.dateCanceled"),
    invalidate: SCHEDULE_QUERIES,
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("meetings.dialogs.dateMenu", { group: groupOf(item), date: day })}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onSelect={() => setCanceling(true)}>
            <CalendarX2 />
            {t("meetings.dialogs.cancelDate")}
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
          group: groupOf(item),
          date: f.longDate(item.date),
        })}
        description={t("meetings.dialogs.cancelDateDescription")}
        reasonHint={t("meetings.dialogs.cancelReasonHint")}
        placeholder={t("meetings.dialogs.cancelReasonPlaceholder")}
        confirmLabel={t("meetings.dialogs.cancelDate")}
        dismissLabel={t("meetings.dialogs.keepDate")}
        tone="destructive"
        onConfirm={async (reason) => (await cancel.execute(item.scheduleId, item.date, reason)).ok}
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
