"use client"

import { CircleCheck, Link2Off } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { FormAlert } from "@/components/form-alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { tokenHash } from "@/lib/routes"

import { AddressTokenGate } from "./address-token"
import { MIN_PASSWORD_LENGTH, setPasswordRequest } from "./api"
import { AuthFrame, AuthHeading, StateIcon } from "./auth-frame"
import { PasswordField } from "./password-field"

import { SignInButton } from "./password-outcome"

export function SetPasswordPage() {
  return <AddressTokenGate>{(token) => <SetPasswordFlow token={token} />}</AddressTokenGate>
}

function SetPasswordFlow({ token }: { token: string }) {
  const t = useTranslations("auth.setPassword")
  const tAuth = useTranslations("auth")
  const [password, setPassword] = useState("")
  const [outcome, setOutcome] = useState<"saved" | "invalid" | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const save = useApiMutation(setPasswordRequest, { toastOnError: false })
  const formRef = useFocusFirstInvalid(save.problem)

  const submit = useSubmitOnce(async () => {
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

  if (outcome === "saved") {
    return (
      <AuthFrame>
        <StateIcon icon={CircleCheck} tone="success" />
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
        <StateIcon icon={Link2Off} tone="warning" />
        <AuthHeading title={t("title")}>
          <p className="max-w-prose">{t("linkInvalid")}</p>
        </AuthHeading>
        <SignInButton label={tAuth("forgotOffice.back")} />
      </AuthFrame>
    )
  }

  return (
    <AuthFrame keepHash={tokenHash(token)}>
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
