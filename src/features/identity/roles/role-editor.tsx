"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { Topbar } from "@/features/portals/staff/topbar"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { useCan } from "@/features/identity/auth/session"
import { routes } from "@/lib/routes"

import { roleQuery } from "./api"
import { RoleForm } from "./role-form"

function EditorPage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  const t = useTranslations()

  return (
    <>
      <Topbar
        crumbs={[
          { label: t("nav.settings"), href: routes.settings() },
          { label: t("roleEditor.roles"), href: `${routes.settings()}#roles` },
          { label: title },
        ]}
      />
      <PageBody>
        <PageHeader title={title} description={description} />
        {children}
      </PageBody>
    </>
  )
}

function NoRoles() {
  const t = useTranslations("roleEditor")

  return (
    <PageBody>
      <NoAccess title={t("noAccess")}>{t("noAccessHint")}</NoAccess>
    </PageBody>
  )
}

function ExistingRole({ id }: { id: string }) {
  const t = useTranslations("roleEditor")
  const query = useQuery(roleQuery(id))

  return (
    <QueryState query={query} notFound={<RecordNotFound area="settings" />}>
      {(role) => (
        <EditorPage title={role.name} description={t("description")}>
          <RoleForm role={role} />
        </EditorPage>
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

export function NewRolePage() {
  const t = useTranslations("roleEditor")
  const can = useCan()

  if (!can("create", "roles")) {
    return <NoRoles />
  }

  return (
    <EditorPage title={t("titleNew")} description={t("descriptionNew")}>
      <RoleForm role={null} />
    </EditorPage>
  )
}
