"use client"

import type { ReactNode } from "react"

import { KhmkMark } from "@/components/brand/logo"
import { NotFoundState } from "@/components/page-states"
import { Link } from "@/i18n/navigation"

import { PortalDesktopNav, type PortalNavItem, PortalTabBar } from "./portal-nav"

export function PortalShell({
  home,
  audience,
  navLabel,
  items,
  menu,
  children,
}: {
  home: string
  audience: string
  navLabel: string
  items: PortalNavItem[]
  menu: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 md:px-6">
          <Link href={home} className="flex items-center gap-2.5">
            <KhmkMark className="size-7" />
            <span className="flex flex-col leading-none whitespace-nowrap">
              <span className="font-heading text-[15px] font-semibold tracking-tight">
                KHMK Köln
              </span>
              <span className="text-[11px] text-muted-foreground">{audience}</span>
            </span>
          </Link>
          <div className="ms-4 hidden self-stretch md:flex">
            <PortalDesktopNav label={navLabel} items={items} home={home} />
          </div>
          <div className="ms-auto flex items-center gap-2">{menu}</div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 md:pt-10 md:pb-12">
        {children}
      </main>
      <PortalTabBar label={navLabel} items={items} home={home} />
    </div>
  )
}

export function PortalNotAvailable({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action: { href: string; label: string }
}) {
  return (
    <NotFoundState
      home={action.href}
      homeLabel={action.label}
      title={title}
      description={description}
    />
  )
}
