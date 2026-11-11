"use client"

import { Ellipsis } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { useFormat } from "@/i18n/format"

import { cancelSessionRequest, type SessionView } from "./api"
import { CancelWithReason } from "./cancel-with-reason"
import { groupOf } from "./session-lines"

export function SessionManageMenu({ session }: { session: SessionView }) {
  const t = useTranslations("meetings")
  const f = useFormat()

  return (
    <CancelWithReason
      trigger={
        <Button variant="outline">
          <Ellipsis data-icon="inline-start" />
          {t("dialogs.sessionMenu")}
        </Button>
      }
      itemLabel={t("dialogs.cancelSession")}
      title={t("dialogs.cancelTitle", { group: groupOf(session), date: f.longDate(session.date) })}
      description={t("dialogs.cancelSessionDescription")}
      confirmLabel={t("dialogs.confirmCancelSession")}
      dismissLabel={t("dialogs.keepSession")}
      successMessage={t("toast.sessionCanceled")}
      onCancel={(reason) => cancelSessionRequest(session.id, reason)}
    />
  )
}
