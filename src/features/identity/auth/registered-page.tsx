"use client"

import { CircleCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import { AuthFrame, AuthHeading } from "./auth-frame"
import { OnlyAfter } from "./only-after"

export function RegisteredPage() {
  const t = useTranslations("auth.registered")

  return (
    <OnlyAfter outcome="registered">
      <AuthFrame>
        <span className="inline-flex size-11 items-center justify-center bg-success-soft text-success">
          <CircleCheck className="size-5" aria-hidden="true" />
        </span>
        <AuthHeading title={t("title")}>
          <p className="max-w-prose">{t("confirm")}</p>
          <p className="max-w-prose">{t("text")}</p>
        </AuthHeading>
        <p className="max-w-prose text-sm">{t("email")}</p>
        <Button variant="outline" asChild className="self-start">
          <Link href={routes.signIn()}>{t("back")}</Link>
        </Button>
      </AuthFrame>
    </OnlyAfter>
  )
}
