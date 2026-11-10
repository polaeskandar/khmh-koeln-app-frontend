"use client"

import { cn } from "cn"
import { CircleAlert, CircleCheck, KeyRound, Link2Off, MailCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState, useSyncExternalStore } from "react"

import { TextField } from "@/components/form-fields"
import { NotFoundPage } from "@/components/not-found-page"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { Link } from "@/i18n/navigation"
import { carryFragment } from "@/i18n/use-switch-locale"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { resetByEmail } from "@/lib/env"
import { routes } from "@/lib/routes"

import { forgetAddressFragment, tokenInAddress } from "./address-token"
import { forgotPasswordRequest, MIN_PASSWORD_LENGTH, setPasswordRequest } from "./api"
import { AuthFrame, AuthHeading } from "./auth-frame"
import { PasswordField } from "./password-field"

const subscribeNothing = () => () => {}

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
  const save = useApiMutation(setPasswordRequest, { toastOnError: false })

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
  return resetByEmail() ? <ForgotPasswordByEmail /> : <ForgotPasswordAtTheOffice />
}

function ForgotPasswordByEmail() {
  const t = useTranslations("auth.forgot")
  const [email, setEmail] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const send = useApiMutation(forgotPasswordRequest, { toastOnError: false })

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
        <StateIcon icon={MailCheck} tone="bg-success-soft text-success" />
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
