"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { Topbar } from "@/features/portals/staff/topbar"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"

export function RoleEditorFrame({
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

export function NoRoles() {
  const t = useTranslations("roleEditor")

  return (
    <PageBody>
      <NoAccess title={t("noAccess")}>{t("noAccessHint")}</NoAccess>
    </PageBody>
  )
}
