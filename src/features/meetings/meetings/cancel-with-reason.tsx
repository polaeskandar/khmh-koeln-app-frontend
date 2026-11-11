"use client"

import { CalendarX2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ReactNode, useState } from "react"

import { ReasonDialog, ReasonProblem } from "@/components/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { SCHEDULE_QUERIES } from "./api"

export function CancelWithReason({
  trigger,
  itemLabel,
  title,
  description,
  confirmLabel,
  dismissLabel,
  successMessage,
  onCancel,
}: {
  trigger: ReactNode
  itemLabel: string
  title: string
  description: string
  confirmLabel: string
  dismissLabel: string
  successMessage: string
  onCancel: (reason: string | null) => Promise<unknown>
}) {
  const t = useTranslations("meetings.dialogs")
  const [canceling, setCanceling] = useState(false)

  const cancel = useApiMutation(onCancel, {
    toastOnError: false,
    successMessage,
    invalidate: SCHEDULE_QUERIES,
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onSelect={() => setCanceling(true)}>
            <CalendarX2 />
            {itemLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ReasonDialog
        open={canceling}
        onOpenChange={(open) => {
          setCanceling(open)

          if (!open) {
            cancel.reset()
          }
        }}
        title={title}
        description={description}
        reasonHint={t("cancelReasonHint")}
        placeholder={t("cancelReasonPlaceholder")}
        confirmLabel={confirmLabel}
        dismissLabel={dismissLabel}
        tone="destructive"
        onConfirm={async (reason) => (await cancel.execute(reason)).ok}
      >
        <ReasonProblem mutation={cancel} />
      </ReasonDialog>
    </>
  )
}
