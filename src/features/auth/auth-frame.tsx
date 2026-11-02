"use client"

import { cn } from "cn"
import { useTranslations } from "next-intl"

import { KhmkMark } from "@/components/brand/logo"
import { LanguageMenu } from "@/components/language-switch"
import { useToday } from "@/hooks/use-today"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import { impressumUrl } from "@/lib/env"
import { routes } from "@/lib/routes"

export function AuthFrame({
  children,
  aside,
  className,
}: {
  children: React.ReactNode
  aside?: React.ReactNode
  className?: string
}) {
  const t = useTranslations("brand")

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 pt-5 md:px-8">
        <Link
          href={routes.signIn()}
          className="flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <KhmkMark className="size-9" />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold tracking-tight">KHMK Köln</span>
            <span className="text-xs text-muted-foreground">{t("church")}</span>
          </span>
        </Link>
        <LanguageMenu />
      </header>
      <main
        className={cn(
          "mx-auto grid w-full max-w-5xl flex-1 content-start gap-10 px-4 pt-10 pb-14 md:gap-16 md:px-8 md:pt-16",
          aside && "md:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]",
          className
        )}
      >
        <div className="flex min-w-0 flex-col gap-7">{children}</div>
        {aside ? (
          <aside className="flex min-w-0 flex-col gap-6 border-t pt-8 text-sm md:border-s md:border-t-0 md:ps-10 md:pt-1">
            {aside}
          </aside>
        ) : null}
      </main>
      <AuthFooter />
    </div>
  )
}

function AuthFooter() {
  const t = useTranslations("auth.footer")
  const legalNotice = impressumUrl()
  const link = "underline-offset-4 hover:text-foreground hover:underline"

  return (
    <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 border-t px-4 py-5 text-xs text-muted-foreground md:px-8">
      <Link href={routes.privacy()} className={link}>
        {t("privacy")}
      </Link>
      {legalNotice ? (
        <a href={legalNotice} target="_blank" rel="noreferrer" className={link}>
          {t("legal")}
        </a>
      ) : null}
    </footer>
  )
}

export function AuthHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {children ? <div className="text-sm text-muted-foreground">{children}</div> : null}
    </div>
  )
}

export function TodayDates() {
  const today = useToday()
  const f = useFormat()

  if (!today) {
    return null
  }

  return (
    <p className="flex flex-col gap-0.5">
      <span className="font-medium">{f.longDate(today)}</span>
      <span className="text-muted-foreground">{f.copticDate(today)}</span>
    </p>
  )
}
