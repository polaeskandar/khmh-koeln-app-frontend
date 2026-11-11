"use client"

import { Info } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { FormPanel } from "@/components/form-panel"
import { ListSkeleton } from "@/components/list-skeleton"
import { useSession } from "@/features/identity/auth/session"
import { OwnData } from "@/features/privacy/own-data/own-data"

import { PasswordSection } from "./password-section"
import { PreferencesFields } from "./preferences-fields"

export function PortalAccount({
  title,
  description,
  labels,
  extra,
  churchSees,
}: {
  title: string
  description: string
  labels: { name: string; email: string }
  extra: { label: string; value: ReactNode }
  churchSees: { title: string; body: string }
}) {
  const t = useTranslations("account")
  const { session } = useSession()

  if (session.status !== "authenticated") {
    return <ListSkeleton />
  }

  const { account } = session.me

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <FormPanel title={t("details")}>
        <dl className="grid gap-4 text-sm sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
          <dt className="text-muted-foreground">{labels.name}</dt>
          <dd dir="auto" className="font-medium">
            {account.displayName}
          </dd>
          <dt className="text-muted-foreground">{labels.email}</dt>
          <dd dir="ltr" className="text-start break-all">
            {account.email}
          </dd>
          <dt className="text-muted-foreground">{extra.label}</dt>
          <dd dir="auto">{extra.value}</dd>
        </dl>
      </FormPanel>
      <FormPanel title={t("preferences")}>
        <PreferencesFields />
      </FormPanel>
      <PasswordSection />
      <section className="flex flex-col gap-2 bg-muted/50 p-5 text-sm">
        <h2 className="inline-flex items-center gap-2 font-heading text-base font-semibold">
          <Info className="size-4 text-muted-foreground" aria-hidden="true" />
          {churchSees.title}
        </h2>
        <p className="text-muted-foreground">{churchSees.body}</p>
      </section>
      <OwnData today={session.me.today} />
    </div>
  )
}
