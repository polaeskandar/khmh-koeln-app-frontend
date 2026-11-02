"use client"

import { House, NotebookPen, UserRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { isPortalActive, type PortalNavItem } from "@/components/portal/portal-nav"
import { routes } from "@/lib/routes"

export const isMemberActive = (href: string, pathname: string | null | undefined) =>
  isPortalActive(href, routes.memberHome(), pathname)

export function useMemberNav(): PortalNavItem[] {
  const t = useTranslations("member.nav")

  return [
    { href: routes.memberHome(), label: t("home"), icon: House },
    { href: routes.memberHomework(), label: t("homework"), icon: NotebookPen },
    { href: routes.memberAccount(), label: t("account"), icon: UserRound },
  ]
}
