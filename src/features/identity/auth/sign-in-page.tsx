"use client"

import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import { AuthFrame, AuthHeading, TodayDates } from "./auth-frame"
import { RedirectIfSignedIn } from "./guards"
import { SignInForm } from "./sign-in-form"

export function SignInPage() {
  const t = useTranslations("auth.signIn")

  return (
    <RedirectIfSignedIn>
      <AuthFrame
        aside={
          <>
            <TodayDates />
            <div className="flex flex-col gap-3">
              <h2 className="font-heading text-base font-semibold tracking-tight">
                {t("newHere")}
              </h2>
              <p className="max-w-prose text-muted-foreground">{t("newHereText")}</p>
              <Button variant="outline" asChild className="self-start">
                <Link href={routes.register()}>
                  {t("register")}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </>
        }
      >
        <AuthHeading title={t("title")}>{t("intro")}</AuthHeading>
        <SignInForm />
      </AuthFrame>
    </RedirectIfSignedIn>
  )
}
