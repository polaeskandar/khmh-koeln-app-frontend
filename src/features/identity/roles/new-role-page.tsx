"use client"

import { useTranslations } from "next-intl"

import { useCan } from "@/features/identity/auth/session"
import { useRouter } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import { createRoleRequest, ROLE_QUERIES } from "./api"
import { RoleForm, useRoleDraft } from "./role-form"
import { RoleEditorFrame, NoRoles } from "./role-editor"

function NewRoleForm() {
  const t = useTranslations("roles.toast")
  const router = useRouter()
  const draft = useRoleDraft(null)

  const save = useApiMutation(createRoleRequest, {
    successMessage: t("created", { name: draft.name.trim() }),
    invalidate: ROLE_QUERIES,
    onSuccess: (created) => router.push(routes.role(created.id)),
  })

  return <RoleForm role={null} draft={draft} save={save} />
}

export function NewRolePage() {
  const t = useTranslations("roles.editor")
  const can = useCan()

  if (!can("create", "roles")) {
    return <NoRoles />
  }

  return (
    <RoleEditorFrame title={t("titleNew")} description={t("descriptionNew")}>
      <NewRoleForm />
    </RoleEditorFrame>
  )
}
