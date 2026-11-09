"use client"

import { CalendarX2, CircleAlert, CircleCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRef, useState, useSyncExternalStore } from "react"

import { TextField } from "@/components/form-fields"
import { NotFoundPage } from "@/components/not-found-page"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import { cancelErasureRequest } from "./api"
import { AuthFrame, AuthHeading } from "./auth-frame"
import { scheduledErasureOn } from "./auth-outcome"
import { PasswordField } from "./password-field"

const subscribeNothing = () => () => {}

function StateIcon({ icon: Icon, tone }: { icon: typeof CalendarX2; tone: string }) {
  return (
    <span className={`inline-flex size-11 items-center justify-center ${tone}`}>
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}

export function ErasureScheduledPage() {
  const inBrowser = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  )

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
  const submitting = useRef(false)
  const cancel = useApiMutation(cancelErasureRequest, { toastOnError: false })

  async function submit() {
    if (submitting.current) {
      return
    }

    submitting.current = true
    setError(null)
    const result = await cancel.execute({ email: email.trim(), password })
    submitting.current = false

    if (result.ok) {
      setCanceled(true)

      return
    }

    setError(
      result.problem.code === "auth.invalidCredentials" ? t("signIn.wrong") : result.problem.message
    )
  }

  if (canceled) {
    return (
      <AuthFrame>
        <StateIcon icon={CircleCheck} tone="bg-success-soft text-success" />
        <div role="status" className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {t("erasureScheduled.canceledTitle")}
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            {t("erasureScheduled.canceledText")}
          </p>
        </div>
        <Button asChild className="self-start">
          <Link href={routes.signIn()}>{t("erasureScheduled.signIn")}</Link>
        </Button>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame>
      <StateIcon icon={CalendarX2} tone="bg-warning-soft text-warning" />
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
        {error ? (
          <Alert variant="destructive" role="alert">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <FieldGroup>
          <TextField
            label={t("signIn.email")}
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            dir="ltr"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <PasswordField
            label={t("signIn.password")}
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            labelExtra={
              <Link
                href={routes.forgotPassword()}
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("signIn.forgot")}
              </Link>
            }
          />
        </FieldGroup>
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
