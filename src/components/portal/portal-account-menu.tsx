"use client"

import { LogOut, type LucideIcon, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { LanguageSubmenu } from "@/components/language-switch"
import { MemberAvatar } from "@/components/member-avatar"
import { AppearanceSubmenu } from "@/components/theme-switch"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Locale } from "@/i18n/config"
import { Link } from "@/i18n/navigation"
import type { Schemas } from "@/lib/api/client"
import { initialsOf } from "@/lib/domain/names"
import { routes } from "@/lib/routes"

type MenuLink = { href: string; icon: LucideIcon; label: string; shown: boolean }

export function PortalAccountMenu({
  account,
  label,
  signingOut,
  onSignOut,
  onSwitchLocale,
  links,
}: {
  account: Schemas["MeResponse"]["account"]
  label: string
  signingOut: boolean
  onSignOut: () => void
  onSwitchLocale: (locale: Locale) => void
  links: MenuLink[]
}) {
  const t = useTranslations()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2" aria-label={label}>
          <MemberAvatar
            name={account.displayName}
            initials={initialsOf(account.displayName)}
            seed={account.id}
            className="size-7"
          />
          <span className="hidden max-w-40 truncate text-sm font-medium tracking-normal normal-case sm:inline md:hidden lg:inline">
            {account.displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="grid leading-tight">
          <span className="truncate">{account.displayName}</span>
          <span dir="ltr" className="truncate text-start text-xs font-normal text-muted-foreground">
            {account.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <LanguageSubmenu onSwitch={onSwitchLocale} />
        <AppearanceSubmenu />
        <DropdownMenuSeparator />
        {links
          .filter((link) => link.shown)
          .map(({ href, icon: Icon, label: linkLabel }) => (
            <DropdownMenuItem key={href} asChild>
              <Link href={href}>
                <Icon />
                {linkLabel}
              </Link>
            </DropdownMenuItem>
          ))}
        <DropdownMenuItem asChild>
          <Link href={routes.privacy()}>
            <ShieldCheck />
            {t("auth.footer.privacy")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={signingOut} onSelect={onSignOut}>
          <LogOut />
          {t("shell.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
