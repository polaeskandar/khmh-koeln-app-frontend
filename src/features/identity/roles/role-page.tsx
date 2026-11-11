"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { useCan } from "@/features/identity/auth/session"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import {
  type RoleDetails,
  type RoleRequest,
  roleQuery,
  ROLE_QUERIES,
  updateRoleRequest,
} from "./api"
import { RoleForm, useRoleDraft } from "./role-form"
import { RoleEditorFrame, NoRoles } from "./role-editor"

function EditRoleForm({ role }: { role: RoleDetails }) {
  const t = useTranslations("roles.toast")
  const draft = useRoleDraft(role)

  const save = useApiMutation((input: RoleRequest) => updateRoleRequest(role.id, input), {
    successMessage: t("saved"),
    invalidate: ROLE_QUERIES,
  })

  return <RoleForm role={role} draft={draft} save={save} />
}

function ExistingRole({ id }: { id: string }) {
  const t = useTranslations("roles.editor")
  const query = useQuery(roleQuery(id))

  return (
    <QueryState query={query} notFound={<RecordNotFound area="settings" />}>
      {(role) => (
        <RoleEditorFrame title={role.name} description={t("description")}>
          <EditRoleForm role={role} />
        </RoleEditorFrame>
      )}
    </QueryState>
  )
}

export function RolePage() {
  const can = useCan()

  if (!can("read", "roles")) {
    return <NoRoles />
  }

  return (
    <RecordPage notFound={<RecordNotFound area="settings" />}>
      {(id) => <ExistingRole id={id} />}
    </RecordPage>
  )
}
