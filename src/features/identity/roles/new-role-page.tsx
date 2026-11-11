"use client"

import { useTranslations } from "next-intl"

import { useCan } from "@/features/identity/auth/session"

import { RoleForm } from "./role-form"

import { RoleEditorFrame, NoRoles } from "./role-editor"

export function NewRolePage() {
  const t = useTranslations("roles.editor")
  const can = useCan()

  if (!can("create", "roles")) {
    return <NoRoles />
  }

  return (
    <RoleEditorFrame title={t("titleNew")} description={t("descriptionNew")}>
      <RoleForm role={null} />
    </RoleEditorFrame>
  )
}
