"use client"

import { CalendarX2, CircleCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { FormAlert } from "@/components/form-alert"
import { NotFoundPage } from "@/components/not-found-page"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useInBrowser } from "@/hooks/use-in-browser"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import { cancelErasureRequest } from "./api"
import { AuthFrame, AuthHeading, StateIcon } from "./auth-frame"
import { scheduledErasureOn } from "./auth-outcome"
import { CredentialsFields } from "./credentials-fields"

export function ErasureScheduledPage() {
  const inBrowser = useInBrowser()

  if (!inBrowser) {
    return null
  }

  const erasesOn = scheduledErasureOn()

  return erasesOn ? <ErasureScheduled erasesOn={erasesOn} /> : <NotFoundPage />
}

function ErasureScheduled({ erasesOn }: { erasesOn: LocalDate }) {
  const t = useTranslations("auth")
  const f = useFormat()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [canceled, setCanceled] = useState(false)
  const cancel = useApiMutation(cancelErasureRequest, { toastOnError: false })

  const submit = useSubmitOnce(async () => {
    setError(null)
    const result = await cancel.execute({ email: email.trim(), password })

    if (result.ok) {
      setCanceled(true)

      return
    }

    setError(
      result.problem.code === "auth.invalidCredentials" ? t("signIn.wrong") : result.problem.message
    )
  })

  if (canceled) {
    return (
      <AuthFrame>
        <StateIcon icon={CircleCheck} tone="success" />
        <AuthHeading title={t("erasureScheduled.canceledTitle")} status>
          <p className="max-w-prose">{t("erasureScheduled.canceledText")}</p>
        </AuthHeading>
        <Button asChild className="self-start">
          <Link href={routes.signIn()}>{t("erasureScheduled.signIn")}</Link>
        </Button>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame>
      <StateIcon icon={CalendarX2} tone="warning" />
      <AuthHeading title={t("erasureScheduled.title")}>
        <p className="max-w-prose">{t("erasureScheduled.text", { date: f.longDate(erasesOn) })}</p>
      </AuthHeading>
      <form
        method="post"
        className="flex flex-col gap-6 border-t pt-7"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-base font-semibold tracking-tight">
            {t("erasureScheduled.cancelTitle")}
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            {t("erasureScheduled.cancelText")}
          </p>
        </div>
        <FormAlert message={error} />
        <CredentialsFields
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
        />
        <Button type="submit" size="lg" disabled={cancel.pending}>
          {cancel.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("erasureScheduled.submit")}
        </Button>
        <Link
          href={routes.signIn()}
          className="self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("erasureScheduled.back")}
        </Link>
      </form>
    </AuthFrame>
  )
}
