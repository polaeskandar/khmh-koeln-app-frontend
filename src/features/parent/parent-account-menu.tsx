"use client"

import { House, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { PortalAccountMenu } from "@/components/portal/portal-account-menu"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useSession } from "@/features/auth/session"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

export function ParentAccountMenu() {
  const t = useTranslations()
  const { session } = useSession()

  if (session.status !== "authenticated") {
    return null
  }

  const { me, areas } = session

  return (
    <PortalAccountMenu
      label={(name) => t("parent.menu.accountOf", { name })}
      links={
        <>
          {areas.staff ? (
            <DropdownMenuItem asChild>
              <Link href={routes.home()}>
                <House />
                {t("shell.openStaffApp")}
              </Link>
            </DropdownMenuItem>
          ) : null}
          {(me.member?.groupCount ?? 0) > 0 ? (
            <DropdownMenuItem asChild>
              <Link href={routes.memberHome()}>
                <UsersRound />
                {t("shell.openMemberPortal")}
              </Link>
            </DropdownMenuItem>
          ) : null}
        </>
      }
    />
  )
}
