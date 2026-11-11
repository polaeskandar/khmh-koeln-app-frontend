"use client"

import { useTranslations } from "next-intl"

import { AuthFrame, AuthHeading } from "./auth-frame"
import { RegisterForm } from "./register-form"

export function RegisterPage() {
  const t = useTranslations("auth.register")
  const steps = [t("step1"), t("step2"), t("step3")]

  return (
    <AuthFrame
      aside={
        <>
          <h2 className="font-heading text-base font-semibold tracking-tight">{t("nextTitle")}</h2>
          <ol className="flex flex-col gap-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex size-6 shrink-0 items-center justify-center border font-heading text-xs font-semibold tabular-nums"
                >
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-muted-foreground">{t("childrenNoAccounts")}</p>
        </>
      }
    >
      <AuthHeading title={t("title")}>{t("intro")}</AuthHeading>
      <RegisterForm />
    </AuthFrame>
  )
}
