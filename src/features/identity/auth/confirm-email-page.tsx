"use client"

import { CircleAlert, CircleCheck, Link2Off, MailCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Link } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import { forgetAddressFragment, tokenInAddress } from "./address-token"
import { confirmEmailRequest } from "./api"
import { AuthFrame, AuthHeading } from "./auth-frame"

type Outcome =
  | { kind: "confirming" }
  | { kind: "confirmed" }
  | { kind: "invalid" }
  | { kind: "failed"; message: string }

const subscribeNothing = () => () => {}

function StateIcon({ icon: Icon, tone }: { icon: typeof MailCheck; tone: string }) {
  return (
    <span className={`inline-flex size-11 items-center justify-center ${tone}`}>
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}

export function ConfirmEmailPage() {
  const inBrowser = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  )

  return inBrowser ? <ConfirmEmailFlow /> : <AuthFrame>{null}</AuthFrame>
}

function ConfirmEmailFlow() {
  const t = useTranslations("auth.confirmEmail")
  const tCommon = useTranslations("common")
  const [token] = useState(tokenInAddress)

  const [outcome, setOutcome] = useState<Outcome>(() =>
    token ? { kind: "confirming" } : { kind: "invalid" }
  )

  const confirm = useApiMutation(confirmEmailRequest, { toastOnError: false })
  const started = useRef(false)

  async function send(value: string) {
    setOutcome({ kind: "confirming" })
    const result = await confirm.execute(value)

    if (result.ok) {
      setOutcome({ kind: "confirmed" })

      return
    }

    setOutcome(
      result.problem.code === "auth.confirmationLinkInvalid"
        ? { kind: "invalid" }
        : { kind: "failed", message: result.problem.message }
    )
  }

  useEffect(forgetAddressFragment, [])

  useEffect(() => {
    if (!token || started.current) {
      return
    }

    started.current = true
    void send(token)
  })

  if (outcome.kind === "confirmed") {
    return (
      <AuthFrame>
        <StateIcon icon={CircleCheck} tone="bg-success-soft text-success" />
        <AuthHeading title={t("confirmedTitle")}>
          <p className="max-w-prose">{t("confirmedText")}</p>
        </AuthHeading>
        <Button variant="outline" asChild className="self-start">
          <Link href={routes.signIn()}>{t("back")}</Link>
        </Button>
      </AuthFrame>
    )
  }

  if (outcome.kind === "invalid") {
    return (
      <AuthFrame>
        <StateIcon icon={Link2Off} tone="bg-warning-soft text-warning" />
        <AuthHeading title={t("title")}>
          <p className="max-w-prose">{t("linkInvalid")}</p>
        </AuthHeading>
        <Button asChild className="self-start">
          <Link href={routes.register()}>{t("register")}</Link>
        </Button>
      </AuthFrame>
    )
  }

  if (outcome.kind === "failed" && token) {
    return (
      <AuthFrame>
        <StateIcon icon={CircleAlert} tone="bg-destructive/10 text-destructive" />
        <AuthHeading title={t("title")}>
          <p className="max-w-prose" role="alert">
            {outcome.message}
          </p>
        </AuthHeading>
        <Button className="self-start" onClick={() => void send(token)}>
          {tCommon("retry")}
        </Button>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame>
      <StateIcon icon={MailCheck} tone="bg-muted text-muted-foreground" />
      <AuthHeading title={t("title")}>
        <p className="inline-flex max-w-prose items-center gap-2" role="status">
          <Spinner aria-hidden="true" />
          {t("confirming")}
        </p>
      </AuthHeading>
    </AuthFrame>
  )
}
