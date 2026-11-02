"use client"

import { useTranslations } from "next-intl"

import { PortalNotAvailable, PortalShell } from "@/components/portal/portal-shell"
import { routes } from "@/lib/routes"

import { MemberAccountMenu } from "./member-account-menu"
import { useMemberNav } from "./member-nav"

export function MemberShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("member")

  return (
    <PortalShell
      home={routes.memberHome()}
      audience={t("brand.forMembers")}
      navLabel={t("nav.label")}
      items={useMemberNav()}
      menu={<MemberAccountMenu />}
    >
      {children}
    </PortalShell>
  )
}

export function MemberNotAvailable() {
  const t = useTranslations("notFound.member")

  return (
    <PortalNotAvailable
      title={t("title")}
      description={t("description")}
      action={{ href: routes.memberHomework(), label: t("action") }}
    />
  )
}
