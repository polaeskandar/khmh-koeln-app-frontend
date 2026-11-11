"use client"

import { House, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { PortalAccountMenu } from "@/components/portal/portal-account-menu"
import { useSession } from "@/features/identity/auth/session"
import { useSwitchLocale } from "@/features/identity/auth/use-switch-locale"
import { routes } from "@/lib/routes"

export function MemberAccountMenu() {
  const t = useTranslations()
  const { session, signOut, signingOut } = useSession()
  const switchLocale = useSwitchLocale()

  if (session.status !== "authenticated") {
    return null
  }

  const { me, areas } = session

  return (
    <PortalAccountMenu
      account={me.account}
      label={t("member.menu.accountOf", { name: me.account.displayName })}
      signingOut={signingOut}
      onSignOut={() => void signOut()}
      onSwitchLocale={switchLocale}
      links={[
        { href: routes.home(), icon: House, label: t("shell.openStaffApp"), shown: areas.staff },
        {
          href: routes.parentHome(),
          icon: UsersRound,
          label: t("shell.openParentPortal"),
          shown: areas.parent,
        },
      ]}
    />
  )
}
