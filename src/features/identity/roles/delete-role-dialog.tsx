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
    successMessage: t("roles.toast.deleted", { name: role.name }),
    invalidate: ROLE_QUERIES,
    onSuccess: onDeleted,
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("roles.list.deleteTitle", { name: isolate(role.name) })}
      description={t("roles.list.deleteDescription", { count: holders })}
      confirmLabel={t("roles.list.deleteConfirm")}
      tone="destructive"
      onConfirm={async () => (await remove.execute(role.id)).ok}
    />
  )
}
