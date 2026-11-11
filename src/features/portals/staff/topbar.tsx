"use client"

import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"
import { Fragment } from "react"

import { KhmkMark } from "@/components/brand/logo"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useNow } from "@/hooks/use-today"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"

export type Crumb = { label: string; href?: string }

export function TodayStamp() {
  const now = useNow()
  const f = useFormat()

  if (!now) {
    return null
  }

  return (
    <div className="hidden flex-col items-end leading-tight lg:flex">
      <span className="text-sm font-medium tabular-nums">
        {f.dayMonth(now.date)} · {now.time}
      </span>
      <span className="text-xs text-muted-foreground">{f.copticDate(now.date)}</span>
    </div>
  )
}

export function Topbar({ crumbs }: { crumbs: Crumb[] }) {
  const t = useTranslations("nav")
  const current = crumbs.at(-1)
  const parent = crumbs.length > 1 ? crumbs.at(-2) : undefined

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ms-1.5 hidden md:inline-flex" />
      <Separator
        orientation="vertical"
        className="me-1 hidden md:block data-vertical:h-4 data-vertical:self-auto"
      />
      {parent?.href ? (
        <Link
          href={parent.href}
          className="-ms-1 flex size-9 shrink-0 items-center justify-center md:hidden"
          aria-label={t("backTo", { page: parent.label })}
        >
          <ArrowLeft className="size-5" />
        </Link>
      ) : (
        <KhmkMark className="size-7 md:hidden" />
      )}
      <span className="min-w-0 truncate font-heading font-semibold md:hidden">
        {current?.label}
      </span>
      <Breadcrumb className="hidden min-w-0 md:block" aria-label={t("breadcrumb")}>
        <BreadcrumbList className="flex-nowrap">
          {crumbs.map((c, i) => (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem className="min-w-0">
                {i === crumbs.length - 1 || !c.href ? (
                  <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="truncate">
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ms-auto flex shrink-0 items-center gap-3">
        <TodayStamp />
      </div>
    </header>
  )
}
