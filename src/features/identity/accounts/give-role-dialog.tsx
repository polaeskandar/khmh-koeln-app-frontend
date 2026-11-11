"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { FormDialog } from "@/components/form-dialog"
import { SelectField } from "@/components/form-fields"
import { NativeSelectOption } from "@/components/ui/native-select"
import { type Role, ROLE_QUERIES } from "@/features/identity/roles/api"
import { Link } from "@/i18n/navigation"
import { isStale, useRefetch } from "@/lib/api/refetch"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { routes } from "@/lib/routes"

import { giveRoleRequest, type StaffAccount, STAFF_ACCOUNT_QUERIES } from "./api"

export function GiveRoleDialog({
  account,
  roles,
  onClose,
}: {
  account: StaffAccount
  roles: Role[]
  onClose: () => void
}) {
  const t = useTranslations()
  const refetch = useRefetch()
  const [roleId, setRoleId] = useState("")

  const give = useApiMutation((id: string) => giveRoleRequest(account.id, id), {
    successMessage: t("toast.roleAssigned"),
    invalidate: ROLE_QUERIES,
    onSuccess: onClose,
  })

  async function submit() {
    const result = await give.execute(roleId)

    if (!result.ok && isStale(result.problem, [409])) {
      void refetch(STAFF_ACCOUNT_QUERIES)
      onClose()
    }
  }

  return (
    <FormDialog
      title={t("settings.users.assign.title", { name: isolate(account.displayName) })}
      description={t("settings.users.assign.description")}
      pending={give.pending}
      problem={give.problem}
      submitLabel={t("settings.users.assign.submit")}
      submitDisabled={!roleId}
      onSubmit={submit}
      onClose={onClose}
    >
      <SelectField
        label={t("settings.users.assign.role")}
        value={roleId}
        error={give.fieldErrors.roleId}
        description={t.rich("settings.users.assign.roleHint", {
          link: (chunks) => (
            <Link href={`${routes.settings()}#roles`} className="underline underline-offset-4">
              {chunks}
            </Link>
          ),
        })}
        onChange={(event) => setRoleId(event.target.value)}
      >
        <NativeSelectOption value="" disabled>
          {t("settings.users.assign.choose")}
        </NativeSelectOption>
        {roles.map((role) => (
          <NativeSelectOption key={role.id} value={role.id}>
            {role.name}
          </NativeSelectOption>
        ))}
      </SelectField>
    </FormDialog>
  )
}
