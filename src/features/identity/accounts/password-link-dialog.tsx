"use client"

import { useTranslations } from "next-intl"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useFormat } from "@/i18n/format"
import type { Problem } from "@/lib/api/translate-problem"
import type { LocalDate } from "@/lib/api/types/common"
import { isolate } from "@/lib/bidi"

import type { PasswordLink, StaffAccount } from "./api"

export function PasswordLinkDialog({
  account,
  today,
  link,
  pending,
  problem,
  onClose,
}: {
  account: StaffAccount
  today: LocalDate
  link: PasswordLink | undefined
  pending: boolean
  problem: Problem | null
  onClose: () => void
}) {
  const t = useTranslations()
  const f = useFormat()

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("settings.users.passwordLink.title", { name: isolate(account.displayName) })}
          </DialogTitle>
          <DialogDescription>
            {t("settings.users.passwordLink.description", {
              name: isolate(account.displayName),
            })}
          </DialogDescription>
        </DialogHeader>
        {problem ? (
          <Alert variant="destructive">
            <AlertDescription>{problem.message}</AlertDescription>
          </Alert>
        ) : link ? (
          <p className="text-sm text-muted-foreground" role="status">
            {t("settings.users.passwordLink.sent", { email: account.email })}{" "}
            {t("settings.users.passwordLink.expires", {
              when: f.atLabel(link.expiresAt, today),
            })}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Spinner />
            {t("settings.users.passwordLink.creating")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
