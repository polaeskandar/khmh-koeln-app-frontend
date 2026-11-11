"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { FormAlert } from "@/components/form-alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { useRouter } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import { forgetOutcome, rememberErasureScheduled, rememberOutcome } from "./auth-outcome"
import { signInRequest } from "./api"
import { CredentialsFields } from "./credentials-fields"
import { useSession } from "./session"

export function SignInForm() {
  const t = useTranslations()
  const router = useRouter()
  const { refresh } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const signIn = useApiMutation(signInRequest, { toastOnError: false })

  const submit = useSubmitOnce(async () => {
    setError(null)
    const result = await signIn.execute({ email, password })

    if (result.ok) {
      forgetOutcome()
      await refresh()
    } else if (result.problem.code === "auth.unconfirmed") {
      rememberOutcome("unconfirmed")
      router.push(routes.signInUnconfirmed())
    } else if (result.problem.code === "auth.pending") {
      rememberOutcome("pending")
      router.push(routes.signInPending())
    } else if (
      result.problem.code === "auth.erasureScheduled" &&
      typeof result.problem.params.erasesOn === "string"
    ) {
      rememberErasureScheduled(result.problem.params.erasesOn)
      router.push(routes.signInErasureScheduled())
    } else {
      setError(
        result.problem.code === "auth.invalidCredentials"
          ? t("auth.signIn.wrong")
          : result.problem.code === "auth.disabled"
            ? t("auth.signIn.disabled")
            : result.problem.message
      )
    }
  })

  return (
    <form
      method="post"
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <FormAlert message={error} />
      <CredentialsFields
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
      />
      <Button type="submit" size="lg" disabled={signIn.pending}>
        {signIn.pending ? <Spinner data-icon="inline-start" /> : null}
        {t("auth.signIn.submit")}
      </Button>
    </form>
  )
}
