"use client"

import { useTranslations } from "next-intl"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader } from "@/components/page-header"
import { RequirePermission } from "@/features/identity/guards"
import { useCan } from "@/features/identity/session"

import { DataProtectionSummary } from "@/features/privacy/data-requests-page"

import { AccountRequests } from "@/features/identity/settings/account-requests"
import { ApproveButton } from "@/features/identity/settings/approve-dialog"
import { ParentAccess } from "@/features/people/parent-access"

import { MemberAccounts } from "@/features/identity/settings/member-accounts"

import { StaffAccounts } from "@/features/identity/settings/staff-accounts"

import { RolesOverview } from "@/features/identity/settings/roles-overview"

export function SettingsPage() {
  const t = useTranslations()
  const can = useCan()

  return (
    <>
      <Topbar crumbs={[{ label: t("nav.settings") }]} />
      <PageBody>
        <PageHeader title={t("nav.settings")} description={t("settings.description")} />
        <RequirePermission action="read" resource="users">
          <AccountRequests
            decide={can("create", "users")}
            approve={(request) => <ApproveButton request={request} />}
          />
        </RequirePermission>
        <RequirePermission action="update" resource="users" fallback={null}>
          <ParentAccess />
        </RequirePermission>
        <RequirePermission action="update" resource="users" fallback={null}>
          <MemberAccounts />
        </RequirePermission>
        <RequirePermission action="read" resource="users" fallback={null}>
          <StaffAccounts />
        </RequirePermission>
        <RequirePermission action="read" resource="roles" fallback={null}>
          <RolesOverview />
        </RequirePermission>
        <RequirePermission action="delete" resource="users" fallback={null}>
          <DataProtectionSummary />
        </RequirePermission>
      </PageBody>
    </>
  )
}
