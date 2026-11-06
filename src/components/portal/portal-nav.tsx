"use client"

import { cn } from "cn"
import type { LucideIcon } from "lucide-react"

import { Link, usePathname } from "@/i18n/navigation"

export type PortalNavItem = { href: string; label: string; icon: LucideIcon }

const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path)

export function isPortalActive(href: string, home: string, pathname: string | null | undefined) {
  if (!pathname) {
    return false
  }

  const item = trimSlash(href)
  const path = trimSlash(pathname.split("?")[0])

  return item === trimSlash(home) ? path === item : path === item || path.startsWith(`${item}/`)
}

type NavProps = { label: string; items: PortalNavItem[]; home: string }

export function PortalDesktopNav({ label, items, home }: NavProps) {
  const pathname = usePathname()

  return (
    <nav aria-label={label} className="hidden items-stretch gap-1 self-stretch md:flex">
      {items.map((item) => {
        const active = isPortalActive(item.href, home, pathname)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center px-3 text-xs font-semibold tracking-wider whitespace-nowrap text-foreground/60 uppercase hover:text-foreground",
              "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-foreground after:opacity-0",
              active && "text-foreground after:opacity-100"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function PortalTabBar({ label, items, home }: NavProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-stretch border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {items.map((item) => {
        const active = isPortalActive(item.href, home, pathname)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-medium text-muted-foreground",
              active && "text-foreground"
            )}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
