"use client"

import { KeyRound, MailCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { FormAlert } from "@/components/form-alert"
import { TextField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { Link } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { resetByEmail } from "@/lib/env"
import { routes } from "@/lib/routes"

import { forgotPasswordRequest } from "./api"
import { AuthFrame, AuthHeading, StateIcon } from "./auth-frame"

export function ForgotPasswordPage() {
  return resetByEmail() ? <ForgotPasswordByEmail /> : <ForgotPasswordAtTheOffice />
}

function ForgotPasswordByEmail() {
  const t = useTranslations("auth.forgot")
  const [email, setEmail] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const send = useApiMutation(forgotPasswordRequest, { toastOnError: false })
  const formRef = useFocusFirstInvalid(send.problem)

  const submit = useSubmitOnce(async () => {
    setAlert(null)
    const address = email.trim()
    const result = await send.execute(address)

    if (result.ok) {
      setSentTo(address)
    } else if (!result.problem.fieldErrors.email) {
      setAlert(result.problem.message)
    }
  })

  if (sentTo) {
    return (
      <AuthFrame>
        <StateIcon icon={MailCheck} tone="success" />
        <div role="status" className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {t("title")}
          </h1>
          <p className="max-w-prose">
            {t.rich("sent", { email: () => <bdi dir="ltr">{sentTo}</bdi> })}
          </p>
          <p className="max-w-prose text-sm text-muted-foreground">{t("sentHint")}</p>
        </div>
        <Button variant="outline" asChild className="self-start">
          <Link href={routes.signIn()}>{t("back")}</Link>
        </Button>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame>
      <AuthHeading title={t("title")}>{t("intro")}</AuthHeading>
      <form
        ref={formRef}
        method="post"
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <FormAlert message={alert} />
        <TextField
          label={t("email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={send.fieldErrors.email}
        />
        <Button type="submit" size="lg" disabled={send.pending}>
          {send.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("submit")}
        </Button>
        <Link
          href={routes.signIn()}
          className="self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("back")}
        </Link>
      </form>
    </AuthFrame>
  )
}

function ForgotPasswordAtTheOffice() {
  const t = useTranslations("auth.forgotOffice")

  return (
    <AuthFrame>
      <StateIcon icon={KeyRound} tone="muted" />
      <AuthHeading title={t("title")}>
        <p className="max-w-prose">{t("text")}</p>
      </AuthHeading>
      <p className="max-w-prose text-sm text-muted-foreground">{t("valid")}</p>
      <Button variant="outline" asChild className="self-start">
        <Link href={routes.signIn()}>{t("back")}</Link>
      </Button>
    </AuthFrame>
  )
}
