"use client"

import { useTranslations } from "next-intl"

import { Topbar } from "@/components/app-shell/topbar"
import { FormPanel } from "@/components/form-panel"
import { PageBody, PageHeader } from "@/components/page-header"
import { PageLoading } from "@/components/page-loading"
import { useSession } from "@/features/identity/auth/session"

import { AccountDetails, PasswordSection, PreferencesFields } from "./account-sections"
import { OwnData } from "@/features/privacy/own-data/own-data"

export function AccountPage() {
  const t = useTranslations("account")
  const { session } = useSession()

  if (session.status !== "authenticated") {
    return <PageLoading />
  }

  return (
    <>
      <Topbar crumbs={[{ label: t("title") }]} />
      <PageBody>
        <PageHeader title={t("title")} description={t("description")} />
        <div className="flex max-w-3xl flex-col gap-6">
          <AccountDetails me={session.me} />
          <FormPanel title={t("preferences")}>
            <PreferencesFields />
          </FormPanel>
          <PasswordSection />
          <OwnData today={session.me.today} />
        </div>
      </PageBody>
    </>
  )
}
