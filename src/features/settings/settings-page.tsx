"use client"

import { useTranslations } from "next-intl"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader } from "@/components/page-header"
import { RequirePermission } from "@/features/auth/guards"
import { useCan } from "@/features/auth/session"

import { AccountRequests } from "./account-requests"
import { ApproveButton } from "./approve-dialog"

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
            approve={(request) =>
              request.registeredAs === "member" ? null : <ApproveButton request={request} />
            }
          />
        </RequirePermission>
      </PageBody>
    </>
  )
}
