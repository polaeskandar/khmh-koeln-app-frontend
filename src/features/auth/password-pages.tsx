"use client"

import { cn } from "cn"
import { CircleAlert, CircleCheck, KeyRound, Link2Off } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Link } from "@/i18n/navigation"
import { carryFragment } from "@/i18n/use-switch-locale"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import { MIN_PASSWORD_LENGTH, setPasswordRequest } from "./api"
import { AuthFrame, AuthHeading } from "./auth-frame"
import { PasswordField } from "./password-field"

const subscribeNothing = () => () => {}

const tokenInAddress = () => new URLSearchParams(window.location.hash.slice(1)).get("token") || null

function forgetAddressFragment() {
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + window.location.search
  )
}

function StateIcon({ icon: Icon, tone }: { icon: typeof KeyRound; tone: string }) {
  return (
    <span className={cn("inline-flex size-11 items-center justify-center", tone)}>
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}

function SignInButton({ label }: { label: string }) {
  return (
    <Button asChild className="self-start">
      <Link href={routes.signIn()}>{label}</Link>
    </Button>
  )
}

export function SetPasswordPage() {
  const inBrowser = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  )

  return inBrowser ? <SetPasswordFlow /> : <AuthFrame>{null}</AuthFrame>
}

function SetPasswordFlow() {
  const t = useTranslations("auth.setPassword")
  const tAuth = useTranslations("auth")
  const [token] = useState(tokenInAddress)
  const [password, setPassword] = useState("")
  const [outcome, setOutcome] = useState<"saved" | "invalid" | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const submitting = useRef(false)
  const save = useApiMutation(setPasswordRequest, { toastOnError: false })

  useEffect(forgetAddressFragment, [])

  useEffect(() => {
    carryFragment(token && outcome === null ? `#token=${encodeURIComponent(token)}` : null)

    return () => carryFragment(null)
  }, [token, outcome])

  async function submit() {
    if (submitting.current || !token) {
      return
    }

    submitting.current = true
    setAlert(null)
    const result = await save.execute({ token, password })
    submitting.current = false

    if (result.ok) {
      setOutcome("saved")
    } else if (result.problem.code === "auth.resetLinkInvalid") {
      setOutcome("invalid")
    } else if (!result.problem.fieldErrors.password) {
      setAlert(result.problem.message)
    }
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

  if (token === null || outcome === "invalid") {
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

export function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotOffice")

  return (
    <AuthFrame>
      <StateIcon icon={KeyRound} tone="bg-muted text-muted-foreground" />
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
