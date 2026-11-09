"use client"

import { Info } from "lucide-react"
import { useTranslations } from "next-intl"

import { FormPanel } from "@/components/form-panel"
import { PasswordSection, PreferencesFields } from "@/features/identity/account/account-sections"
import { useSession } from "@/features/identity/auth/session"
import { ListSkeleton } from "@/features/learning/homework/task-list"
import { useFormat } from "@/i18n/format"
import { ApiError } from "@/lib/api/problem"

import { type MemberGroup, useMemberGroups } from "@/features/people/groups/api"

function GroupsLine() {
  const t = useTranslations("member.account")
  const f = useFormat()
  const groups = useMemberGroups()

  if (groups.error instanceof ApiError && groups.error.status === 403) {
    return <>{t("notLinked")}</>
  }

  if (!groups.data) {
    return null
  }

  if (groups.data.items.length === 0) {
    return <>{t("noGroups")}</>
  }

  const name = (group: MemberGroup) =>
    group.stage ? `${group.stage.name} (${group.service.name})` : group.service.name

  return <>{f.list(groups.data.items.map(name))}</>
}

export function MemberAccount() {
  const t = useTranslations()
  const { session } = useSession()

  if (session.status !== "authenticated") {
    return <ListSkeleton />
  }

  const { account } = session.me

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t("member.nav.account")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("member.account.description")}</p>
      </header>
      <FormPanel title={t("account.details")}>
        <dl className="grid gap-4 text-sm sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
          <dt className="text-muted-foreground">{t("account.name")}</dt>
          <dd dir="auto" className="font-medium">
            {account.displayName}
          </dd>
          <dt className="text-muted-foreground">{t("account.email")}</dt>
          <dd dir="ltr" className="text-start break-all">
            {account.email}
          </dd>
          <dt className="text-muted-foreground">{t("member.account.groups")}</dt>
          <dd dir="auto">
            <GroupsLine />
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
          {t("member.account.churchSees.title")}
        </h2>
        <p className="text-muted-foreground">{t("member.account.churchSees.body")}</p>
      </section>
    </div>
  )
}
