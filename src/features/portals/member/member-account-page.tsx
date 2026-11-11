"use client"

import { useTranslations } from "next-intl"

import { PortalAccount } from "@/features/identity/account/portal-account"
import { type MemberGroup, useMemberGroups } from "@/features/people/groups/api"
import { useFormat } from "@/i18n/format"

const groupName = (group: MemberGroup) =>
  group.stage ? `${group.stage.name} (${group.service.name})` : group.service.name

function GroupsLine() {
  const t = useTranslations("member.account")
  const f = useFormat()
  const { groups, unlinked } = useMemberGroups()

  if (unlinked) {
    return <>{t("notLinked")}</>
  }

  if (!groups.data) {
    return null
  }

  if (groups.data.items.length === 0) {
    return <>{t("noGroups")}</>
  }

  return <>{f.list(groups.data.items.map(groupName))}</>
}

export function MemberAccountPage() {
  const t = useTranslations()

  return (
    <PortalAccount
      title={t("member.nav.account")}
      description={t("member.account.description")}
      labels={{ name: t("account.name"), email: t("account.email") }}
      extra={{ label: t("member.account.groups"), value: <GroupsLine /> }}
      churchSees={{
        title: t("member.account.churchSees.title"),
        body: t("member.account.churchSees.body"),
      }}
    />
  )
}
