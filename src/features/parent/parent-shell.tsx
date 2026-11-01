"use client"

import { SearchX } from "lucide-react"
import { useTranslations } from "next-intl"

import { KhmkMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import { ParentAccountMenu } from "./parent-account-menu"
import { ParentDesktopNav, ParentTabBar } from "./parent-nav"

export function ParentShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("parent.brand")

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 md:px-6">
          <Link href={routes.parentHome()} className="flex items-center gap-2.5">
            <KhmkMark className="size-7" />
            <span className="flex flex-col leading-none whitespace-nowrap">
              <span className="font-heading text-[15px] font-semibold tracking-tight">
                KHMK Köln
              </span>
              <span className="text-[11px] text-muted-foreground">{t("forParents")}</span>
            </span>
          </Link>
          <div className="ms-4 hidden self-stretch md:flex">
            <ParentDesktopNav />
          </div>
          <div className="ms-auto flex items-center gap-2">
            <ParentAccountMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 md:pt-10 md:pb-12">
        {children}
      </main>
      <ParentTabBar />
    </div>
  )
}

export function ParentNotAvailable() {
  const t = useTranslations("notFound.parent")

  return (
    <div className="flex min-h-[50svh] items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("description")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href={routes.parentHomework()}>{t("action")}</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
