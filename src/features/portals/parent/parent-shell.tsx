"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { PortalNotAvailable, PortalShell } from "@/components/portal/portal-shell"
import { routes } from "@/lib/routes"

import { ParentAccountMenu } from "./parent-account-menu"
import { useParentNav } from "./parent-nav"

export function ParentShell({ children }: { children: ReactNode }) {
  const t = useTranslations("parent")

  return (
    <PortalShell
      home={routes.parentHome()}
      audience={t("brand.forParents")}
      navLabel={t("nav.label")}
      items={useParentNav()}
      menu={<ParentAccountMenu />}
    >
      {children}
    </PortalShell>
  )
}

export function ParentNotAvailable() {
  const t = useTranslations("notFound.parent")

  return (
    <PortalNotAvailable
      title={t("title")}
      description={t("description")}
      action={{ href: routes.parentHomework(), label: t("action") }}
    />
  )
}
