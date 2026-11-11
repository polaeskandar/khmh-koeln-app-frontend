"use client"

import { useTranslations } from "next-intl"

import { Topbar } from "@/features/portals/staff/topbar"
import { PageBody, PageHeader } from "@/components/page-header"
import { RequirePermission } from "@/features/identity/auth/guards"
import { useCan } from "@/features/identity/auth/session"

import { DataProtectionSummary } from "@/features/privacy/data-requests/data-requests-page"

import { AccountRequests } from "./account-requests"
import { ApproveButton } from "./approve-dialog"
import { ParentAccess } from "@/features/people/guardians/parent-access"

import { MemberAccounts } from "./member-accounts"

import { StaffAccounts } from "./staff-accounts"

import { RolesOverview } from "@/features/identity/roles/roles-overview"

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
            decline={can("delete", "users")}
            approve={
              can("update", "users") && can("update", "roles")
                ? (request) => <ApproveButton request={request} />
                : undefined
            }
          />
        </RequirePermission>
        <RequirePermission action="read" resource="users" fallback={null}>
          <ParentAccess />
        </RequirePermission>
        <RequirePermission action="read" resource="users" fallback={null}>
          <MemberAccounts />
        </RequirePermission>
        <RequirePermission action="read" resource="users" fallback={null}>
          <StaffAccounts />
        </RequirePermission>
        <RequirePermission action="read" resource="roles" fallback={null}>
          <RolesOverview />
        </RequirePermission>
        <RequirePermission action="update" resource="users" fallback={null}>
          <DataProtectionSummary />
        </RequirePermission>
      </PageBody>
    </>
  )
}
