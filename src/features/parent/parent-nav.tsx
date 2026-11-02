"use client"

import { cn } from "cn"
import { House, type LucideIcon, NotebookPen, UserRound, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, usePathname } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

type Item = { href: string; key: "home" | "children" | "homework" | "account"; icon: LucideIcon }

export const PARENT_NAV: Item[] = [
  { href: routes.parentHome(), key: "home", icon: House },
  { href: routes.parentChildren(), key: "children", icon: UsersRound },
  { href: routes.parentHomework(), key: "homework", icon: NotebookPen },
  { href: routes.parentAccount(), key: "account", icon: UserRound },
]

const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path)

export function isParentActive(href: string, pathname: string | null | undefined) {
  if (!pathname) {
    return false
  }

  const item = trimSlash(href)
  const path = trimSlash(pathname.split("?")[0])

  return item === trimSlash(routes.parentHome())
    ? path === item
    : path === item || path.startsWith(`${item}/`)
}

export function ParentDesktopNav() {
  const t = useTranslations("parent.nav")
  const pathname = usePathname()

  return (
    <nav aria-label={t("label")} className="hidden items-stretch gap-1 self-stretch md:flex">
      {PARENT_NAV.map((item) => {
        const active = isParentActive(item.href, pathname)

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center px-3 text-xs font-semibold tracking-wider whitespace-nowrap text-foreground/60 uppercase hover:text-foreground",
              "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-foreground after:opacity-0",
              active && "text-foreground after:opacity-100"
            )}
          >
            {t(item.key)}
          </Link>
        )
      })}
    </nav>
  )
}

export function ParentTabBar() {
  const t = useTranslations("parent.nav")
  const pathname = usePathname()

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-stretch border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {PARENT_NAV.map((item) => {
        const active = isParentActive(item.href, pathname)

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-medium text-muted-foreground",
              active && "text-foreground"
            )}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {t(item.key)}
          </Link>
        )
      })}
    </nav>
  )
}
