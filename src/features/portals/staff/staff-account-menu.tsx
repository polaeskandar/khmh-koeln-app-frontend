"use client"

import { ChevronsUpDown, House, LogOut, ShieldCheck, UserRound, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { LanguageSubmenu } from "@/components/language-switch"
import { useSwitchLocale } from "@/features/identity/auth/use-switch-locale"
import { AppearanceSubmenu } from "@/components/theme-switch"
import { MemberAvatar } from "@/components/member-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { roleSummary } from "@/features/identity/auth/role-summary"
import { initialsOf } from "@/lib/domain/names"
import { useSession } from "@/features/identity/auth/session"
import { useInlineEnd } from "@/i18n/direction"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

export function AccountMenuItems() {
  const t = useTranslations()
  const switchLocale = useSwitchLocale()
  const { session, signOut, signingOut } = useSession()
  const parent = session.status === "authenticated" && session.areas.parent
  const member = session.status === "authenticated" && (session.me.member?.groupCount ?? 0) > 0

  return (
    <>
      <DropdownMenuItem asChild>
        <Link href={routes.account()}>
          <UserRound />
          {t("shell.yourAccount")}
        </Link>
      </DropdownMenuItem>
      <LanguageSubmenu onSwitch={switchLocale} />
      <AppearanceSubmenu />
      <DropdownMenuSeparator />
      {member ? (
        <DropdownMenuItem asChild>
          <Link href={routes.memberHome()}>
            <UsersRound />
            {t("shell.openMemberPortal")}
          </Link>
        </DropdownMenuItem>
      ) : null}
      {parent ? (
        <DropdownMenuItem asChild>
          <Link href={routes.parentHome()}>
            <House />
            {t("shell.openParentPortal")}
          </Link>
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem asChild>
        <Link href={routes.privacy()}>
          <ShieldCheck />
          {t("auth.footer.privacy")}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem disabled={signingOut} onSelect={() => void signOut()}>
        <LogOut />
        {t("shell.signOut")}
      </DropdownMenuItem>
    </>
  )
}

export function NavUser() {
  const t = useTranslations()
  const side = useInlineEnd()
  const { session } = useSession()

  if (session.status !== "authenticated") {
    return null
  }

  const { me } = session

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={t("shell.accountMenu")}
              className="data-[state=open]:bg-sidebar-accent"
            >
              <MemberAvatar
                name={me.account.displayName}
                initials={initialsOf(me.account.displayName)}
                seed={me.account.id}
              />
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{me.account.displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {roleSummary(me, t("roles.summary.none"))}
                </span>
              </div>
              <ChevronsUpDown className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72" side={side} align="end">
            <AccountMenuItems />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
