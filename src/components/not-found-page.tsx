"use client"

import { useTranslations } from "next-intl"

import { KhmkMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

export function NotFoundPage() {
  const t = useTranslations("notFound")

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-4 py-10">
      <KhmkMark className="size-10" />
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("root.description")}</p>
      <div>
        <Button asChild>
          <Link href={routes.home()}>{t("root.openApp")}</Link>
        </Button>
      </div>
    </main>
  )
}
