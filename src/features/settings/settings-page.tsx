"use client"

import { useTranslations } from "next-intl"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader } from "@/components/page-header"
import { RequirePermission } from "@/features/auth/guards"

import { AccountRequests } from "./account-requests"
import { MemberAccounts } from "./member-accounts"

export function SettingsPage() {
  const t = useTranslations()

  return (
    <>
      <Topbar crumbs={[{ label: t("nav.settings") }]} />
      <PageBody>
        <PageHeader title={t("nav.settings")} description={t("settings.description")} />
        <RequirePermission action="read" resource="users">
          <AccountRequests />
        </RequirePermission>
        <RequirePermission action="update" resource="users" fallback={null}>
          <MemberAccounts />
        </RequirePermission>
      </PageBody>
    </>
  )
}
