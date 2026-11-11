"use client"

import { CircleAlert, CircleCheck, Link2Off, MailCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Link } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import { AddressTokenGate } from "./address-token"
import { confirmEmailRequest } from "./api"
import { AuthFrame, AuthHeading, StateIcon } from "./auth-frame"

type Outcome =
  | { kind: "confirming" }
  | { kind: "confirmed" }
  | { kind: "invalid" }
  | { kind: "failed"; message: string }

export function ConfirmEmailPage() {
  return <AddressTokenGate>{(token) => <ConfirmEmailFlow token={token} />}</AddressTokenGate>
}

function ConfirmEmailFlow({ token }: { token: string }) {
  const t = useTranslations("auth.confirmEmail")
  const tCommon = useTranslations("common")
  const [outcome, setOutcome] = useState<Outcome>({ kind: "confirming" })

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

  useEffect(() => {
    if (started.current) {
      return
    }

    started.current = true
    void send(token)
  })

  if (outcome.kind === "confirmed") {
    return (
      <AuthFrame>
        <StateIcon icon={CircleCheck} tone="success" />
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
        <StateIcon icon={Link2Off} tone="warning" />
        <AuthHeading title={t("title")}>
          <p className="max-w-prose">{t("linkInvalid")}</p>
        </AuthHeading>
        <Button asChild className="self-start">
          <Link href={routes.register()}>{t("register")}</Link>
        </Button>
      </AuthFrame>
    )
  }

  if (outcome.kind === "failed") {
    return (
      <AuthFrame>
        <StateIcon icon={CircleAlert} tone="destructive" />
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
      <StateIcon icon={MailCheck} tone="muted" />
      <AuthHeading title={t("title")}>
        <p className="inline-flex max-w-prose items-center gap-2" role="status">
          <Spinner aria-hidden="true" />
          {t("confirming")}
        </p>
      </AuthHeading>
    </AuthFrame>
  )
}
