"use client"

import { LogOut, ShieldCheck } from "lucide-react"
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
import { useSession } from "@/features/identity/auth/session"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

const initialsOf = (name: string) => {
  const words = name.trim().split(/\s+/)

  return `${words[0]?.charAt(0) ?? ""}${words.length > 1 ? (words.at(-1)?.charAt(0) ?? "") : ""}`.toUpperCase()
}

export function PortalAccountMenu({
  label,
  links,
}: {
  label: (name: string) => string
  links: React.ReactNode
}) {
  const t = useTranslations()
  const { session, signOut, signingOut } = useSession()

  if (session.status !== "authenticated") {
    return null
  }

  const { me } = session

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 px-2"
          aria-label={label(me.account.displayName)}
        >
          <MemberAvatar
            name={me.account.displayName}
            initials={initialsOf(me.account.displayName)}
            seed={me.account.id}
            className="size-7"
          />
          <span className="hidden max-w-40 truncate text-sm font-medium tracking-normal normal-case sm:inline md:hidden lg:inline">
            {me.account.displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="grid leading-tight">
          <span className="truncate">{me.account.displayName}</span>
          <span dir="ltr" className="truncate text-start text-xs font-normal text-muted-foreground">
            {me.account.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <LanguageSubmenu />
        <AppearanceSubmenu />
        <DropdownMenuSeparator />
        {links}
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
