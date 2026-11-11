"use client"

import { Ellipsis } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { useFormat } from "@/i18n/format"

import { cancelOccurrenceRequest, type PlannedSession } from "./api"
import { CancelWithReason } from "./cancel-with-reason"
import { groupOf } from "./session-lines"

export function OccurrenceMenu({ item }: { item: PlannedSession }) {
  const t = useTranslations("meetings")
  const f = useFormat()
  const day = f.longDate(item.date).replace(/ \d{4}$/, "")

  return (
    <CancelWithReason
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("dialogs.dateMenu", { group: groupOf(item), date: day })}
        >
          <Ellipsis />
        </Button>
      }
      itemLabel={t("dialogs.cancelDate")}
      title={t("dialogs.cancelTitle", { group: groupOf(item), date: f.longDate(item.date) })}
      description={t("dialogs.cancelDateDescription")}
      confirmLabel={t("dialogs.cancelDate")}
      dismissLabel={t("dialogs.keepDate")}
      successMessage={t("toast.dateCanceled")}
      onCancel={(reason) => cancelOccurrenceRequest(item.scheduleId, item.date, reason)}
    />
  )
}
