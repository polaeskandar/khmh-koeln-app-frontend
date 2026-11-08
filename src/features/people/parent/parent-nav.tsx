"use client"

import { House, NotebookPen, UserRound, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { isPortalActive, type PortalNavItem } from "@/components/portal/portal-nav"
import { routes } from "@/lib/routes"

export const isParentActive = (href: string, pathname: string | null | undefined) =>
  isPortalActive(href, routes.parentHome(), pathname)

export function useParentNav(): PortalNavItem[] {
  const t = useTranslations("parent.nav")

  return [
    { href: routes.parentHome(), label: t("home"), icon: House },
    { href: routes.parentChildren(), label: t("children"), icon: UsersRound },
    { href: routes.parentHomework(), label: t("homework"), icon: NotebookPen },
    { href: routes.parentAccount(), label: t("account"), icon: UserRound },
  ]
}
