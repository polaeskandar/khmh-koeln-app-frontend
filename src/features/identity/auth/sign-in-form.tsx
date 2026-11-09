"use client"

import { CircleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRef, useState } from "react"

import { TextField } from "@/components/form-fields"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Link, useRouter } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import { signInRequest } from "./api"
import { PasswordField } from "./password-field"
import { useSession } from "./session"

export function SignInForm() {
  const t = useTranslations()
  const router = useRouter()
  const { refresh } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  const signIn = useApiMutation(signInRequest, { toastOnError: false })

  async function submit() {
    if (submitting.current) {
      return
    }

    submitting.current = true
    setError(null)
    const result = await signIn.execute({ email, password })

    if (result.ok) {
      await refresh()
    } else if (result.problem.code === "auth.pending") {
      router.push(routes.signInPending())
    } else {
      setError(
        result.problem.code === "auth.invalidCredentials"
          ? t("auth.signIn.wrong")
          : result.problem.code === "auth.disabled"
            ? t("auth.signIn.disabled")
            : result.problem.message
      )
    }

    submitting.current = false
  }

  return (
    <form
      method="post"
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      {error ? (
        <Alert variant="destructive" role="alert">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <TextField
          label={t("auth.signIn.email")}
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          dir="ltr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label={t("auth.signIn.password")}
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          labelExtra={
            <Link
              href={routes.forgotPassword()}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("auth.signIn.forgot")}
            </Link>
          }
        />
      </FieldGroup>
      <Button type="submit" size="lg" disabled={signIn.pending}>
        {signIn.pending ? <Spinner data-icon="inline-start" /> : null}
        {t("auth.signIn.submit")}
      </Button>
    </form>
  )
}
