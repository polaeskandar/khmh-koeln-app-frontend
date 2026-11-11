"use client"

import { MailWarning } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import { AuthFrame, AuthHeading } from "./auth-frame"
import { OnlyAfter } from "./only-after"

export function UnconfirmedPage() {
  const t = useTranslations("auth.unconfirmed")

  return (
    <OnlyAfter outcome="unconfirmed">
      <AuthFrame>
        <span className="inline-flex size-11 items-center justify-center bg-warning-soft text-warning">
          <MailWarning className="size-5" aria-hidden="true" />
        </span>
        <AuthHeading title={t("title")}>
          <p className="max-w-prose">{t("text")}</p>
        </AuthHeading>
        <ul className="flex max-w-prose list-disc flex-col gap-2 ps-5 text-sm">
          <li>{t("valid")}</li>
          <li>{t("again")}</li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={routes.signIn()}>{t("back")}</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={routes.register()}>{t("register")}</Link>
          </Button>
        </div>
      </AuthFrame>
    </OnlyAfter>
  )
}
