"use client"

import { cn } from "cn"
import { Menu } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession } from "@/features/auth/session"
import { Link, usePathname } from "@/i18n/navigation"

import { AccountMenuItems } from "./account-menu"
import { isActive, NAV, type NavItem, SETTINGS, showsSettings, TAKE_ATTENDANCE } from "./nav"

const item = (key: NavItem["key"]) => NAV.find((i) => i.key === key)!

const TAKE_SCREEN = "/attendance/take/"

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const t = useTranslations("nav")

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
        active && "text-foreground"
      )}
    >
      <item.icon className="size-5" aria-hidden="true" />
      {t(item.key)}
    </Link>
  )
}

export function MobileTabBar() {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const { session } = useSession()

  if (isActive(TAKE_SCREEN, pathname)) {
    return null
  }

  const settings = session.status === "authenticated" && showsSettings(session.areas)
  const attendance = isActive(TAKE_ATTENDANCE.href, pathname)

  return (
    <nav
      aria-label={t("main")}
      className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-stretch border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <Tab item={item("services")} active={isActive(item("services").href, pathname)} />
      <Tab item={item("meetings")} active={isActive(item("meetings").href, pathname)} />
      <div className="flex flex-1 flex-col items-center">
        <Link
          href={TAKE_ATTENDANCE.href}
          aria-label={t("takeAttendance")}
          aria-current={attendance ? "page" : undefined}
          className="relative -mt-5 flex size-14 items-center justify-center bg-primary text-primary-foreground shadow-lg ring-4 ring-background"
        >
          <TAKE_ATTENDANCE.icon className="size-6" aria-hidden="true" />
        </Link>
        <span
          className={cn(
            "mt-0.5 text-[11px] font-medium text-muted-foreground",
            attendance && "text-foreground"
          )}
          aria-hidden="true"
        >
          {t("attendance")}
        </span>
      </div>
      <Tab item={item("members")} active={isActive(item("members").href, pathname)} />
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground outline-none",
            settings && isActive(SETTINGS.href, pathname) && "text-foreground"
          )}
        >
          <Menu className="size-5" aria-hidden="true" />
          {t("more")}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72" side="top" align="end">
          {settings ? (
            <>
              <DropdownMenuItem asChild>
                <Link href={SETTINGS.href}>
                  <SETTINGS.icon />
                  {t("settings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <AccountMenuItems />
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
