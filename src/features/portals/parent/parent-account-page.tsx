"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { PortalAccount } from "@/features/identity/account/portal-account"
import { parentChildrenQuery } from "@/features/people/children/api"
import { useFormat } from "@/i18n/format"

function ChildrenLine() {
  const t = useTranslations()
  const f = useFormat()
  const children = useQuery(parentChildrenQuery)

  if (children.isError) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2 text-destructive">
        {t("errors.loadFailed")}
        <Button variant="outline" size="sm" onClick={() => children.refetch()}>
          {t("common.retry")}
        </Button>
      </span>
    )
  }

  if (!children.data) {
    return null
  }

  const names = children.data.items.map((child) => child.fullName)

  return <>{names.length > 0 ? names.join(f.separator) : t("parent.account.noneLinked")}</>
}

export function ParentAccountPage() {
  const t = useTranslations()

  return (
    <PortalAccount
      title={t("parent.nav.account")}
      description={t("parent.account.description")}
      labels={{ name: t("parent.account.name"), email: t("parent.account.email") }}
      extra={{ label: t("parent.account.children"), value: <ChildrenLine /> }}
      churchSees={{
        title: t("parent.account.churchSees.title"),
        body: t("parent.account.churchSees.body"),
      }}
    />
  )
}
