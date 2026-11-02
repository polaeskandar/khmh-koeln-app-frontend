"use client"

import { Info } from "lucide-react"
import { useTranslations } from "next-intl"

import { FormPanel } from "@/components/form-panel"
import { PasswordSection, PreferencesFields } from "@/features/account/account-sections"
import { OwnData } from "@/features/account/own-data"
import { useSession } from "@/features/auth/session"
import { useFormat } from "@/i18n/format"

import { useParentChildren } from "./api"
import { ListSkeleton } from "./parent-bits"

export function ParentAccount() {
  const t = useTranslations()
  const f = useFormat()
  const { session } = useSession()
  const children = useParentChildren()

  if (session.status !== "authenticated") {
    return <ListSkeleton />
  }

  const { account } = session.me
  const names = children.data?.items.map((child) => child.fullName) ?? []

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t("parent.nav.account")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("parent.account.description")}</p>
      </header>
      <FormPanel title={t("account.details")}>
        <dl className="grid gap-4 text-sm sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
          <dt className="text-muted-foreground">{t("parent.account.name")}</dt>
          <dd dir="auto" className="font-medium">
            {account.displayName}
          </dd>
          <dt className="text-muted-foreground">{t("parent.account.email")}</dt>
          <dd dir="ltr" className="text-start break-all">
            {account.email}
          </dd>
          <dt className="text-muted-foreground">{t("parent.account.children")}</dt>
          <dd dir="auto">
            {children.data
              ? names.length > 0
                ? names.join(f.separator)
                : t("parent.account.noneLinked")
              : null}
          </dd>
        </dl>
      </FormPanel>
      <FormPanel title={t("account.preferences")}>
        <PreferencesFields />
      </FormPanel>
      <PasswordSection />
      <section className="flex flex-col gap-2 bg-muted/50 p-5 text-sm">
        <h2 className="inline-flex items-center gap-2 font-heading text-base font-semibold">
          <Info className="size-4 text-muted-foreground" aria-hidden="true" />
          {t("parent.account.churchSees.title")}
        </h2>
        <p className="text-muted-foreground">{t("parent.account.churchSees.body")}</p>
      </section>
      <OwnData today={session.me.today} />
    </div>
  )
}
