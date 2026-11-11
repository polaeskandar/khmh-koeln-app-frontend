"use client"

import { useTranslations } from "next-intl"

import { ConfirmDialog } from "@/components/confirm-dialog"
import type { Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"

import { deleteRoleRequest, ROLE_QUERIES } from "./api"

export function DeleteRoleDialog({
  role,
  holders,
  open,
  onOpenChange,
  onDeleted,
}: {
  role: { id: Uuid; name: string }
  holders: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}) {
  const t = useTranslations()

  const remove = useApiMutation(deleteRoleRequest, {
    successMessage: t("toast.roleDeleted", { name: role.name }),
    invalidate: ROLE_QUERIES,
    onSuccess: onDeleted,
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("settings.roles.deleteTitle", { name: isolate(role.name) })}
      description={t("settings.roles.deleteDescription", { count: holders })}
      confirmLabel={t("settings.roles.deleteConfirm")}
      tone="destructive"
      onConfirm={async () => (await remove.execute(role.id)).ok}
    />
  )
}
