"use client"

import { ArrowRight, Hourglass } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { registrationEnabled } from "@/lib/env"
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
            {registrationEnabled() ? (
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
            ) : null}
          </>
        }
      >
        <AuthHeading title={t("title")}>{t("intro")}</AuthHeading>
        <SignInForm />
      </AuthFrame>
    </RedirectIfSignedIn>
  )
}

export function PendingPage() {
  const t = useTranslations("auth.pending")

  return (
    <AuthFrame>
      <span className="inline-flex size-11 items-center justify-center bg-warning-soft text-warning">
        <Hourglass className="size-5" aria-hidden="true" />
      </span>
      <AuthHeading title={t("title")}>
        <p className="max-w-prose">{t("text")}</p>
      </AuthHeading>
      <ul className="flex max-w-prose list-disc flex-col gap-2 ps-5 text-sm">
        <li>{t("parents")}</li>
        <li>{t("servants")}</li>
        <li>{t("email")}</li>
      </ul>
      <p className="max-w-prose text-sm text-muted-foreground">{t("slow")}</p>
      <Button variant="outline" asChild className="self-start">
        <Link href={routes.signIn()}>{t("back")}</Link>
      </Button>
    </AuthFrame>
  )
}
