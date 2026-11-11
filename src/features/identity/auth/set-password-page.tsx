"use client"

import { CircleAlert, CircleCheck, Link2Off } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { NotFoundPage } from "@/components/not-found-page"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useInBrowser } from "@/hooks/use-in-browser"
import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { carryFragment } from "./use-switch-locale"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { forgetAddressFragment, tokenInAddress } from "./address-token"
import { MIN_PASSWORD_LENGTH, setPasswordRequest } from "./api"
import { AuthFrame, AuthHeading } from "./auth-frame"
import { PasswordField } from "./password-field"

import { SignInButton, StateIcon } from "./password-outcome"

export function SetPasswordPage() {
  const inBrowser = useInBrowser()

  return inBrowser ? <SetPasswordFlow /> : <AuthFrame>{null}</AuthFrame>
}

function SetPasswordFlow() {
  const t = useTranslations("auth.setPassword")
  const tAuth = useTranslations("auth")
  const [token] = useState(tokenInAddress)
  const [password, setPassword] = useState("")
  const [outcome, setOutcome] = useState<"saved" | "invalid" | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const save = useApiMutation(setPasswordRequest, { toastOnError: false })
  const formRef = useFocusFirstInvalid(save.problem)

  useEffect(forgetAddressFragment, [])

  useEffect(() => {
    carryFragment(token && outcome === null ? `#token=${encodeURIComponent(token)}` : null)

    return () => carryFragment(null)
  }, [token, outcome])

  const submit = useSubmitOnce(async () => {
    if (!token) {
      return
    }

    setAlert(null)
    const result = await save.execute({ token, password })

    if (result.ok) {
      setOutcome("saved")
    } else if (result.problem.code === "auth.resetLinkInvalid") {
      setOutcome("invalid")
    } else if (!result.problem.fieldErrors.password) {
      setAlert(result.problem.message)
    }
  })

  if (token === null) {
    return <NotFoundPage />
  }

  if (outcome === "saved") {
    return (
      <AuthFrame>
        <StateIcon icon={CircleCheck} tone="bg-success-soft text-success" />
        <AuthHeading title={t("successTitle")}>
          <p className="max-w-prose">{t("successText")}</p>
        </AuthHeading>
        <SignInButton label={t("signIn")} />
      </AuthFrame>
    )
  }

  if (outcome === "invalid") {
    return (
      <AuthFrame>
        <StateIcon icon={Link2Off} tone="bg-warning-soft text-warning" />
        <AuthHeading title={t("title")}>
          <p className="max-w-prose">{t("linkInvalid")}</p>
        </AuthHeading>
        <SignInButton label={tAuth("forgotOffice.back")} />
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
        {alert ? (
          <Alert variant="destructive" role="alert">
            <CircleAlert />
            <AlertDescription>{alert}</AlertDescription>
          </Alert>
        ) : null}
        <PasswordField
          label={t("password")}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          description={t("passwordHint", { min: MIN_PASSWORD_LENGTH })}
          error={save.fieldErrors.password}
        />
        <Button type="submit" size="lg" disabled={save.pending}>
          {save.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("submit")}
        </Button>
      </form>
    </AuthFrame>
  )
}
