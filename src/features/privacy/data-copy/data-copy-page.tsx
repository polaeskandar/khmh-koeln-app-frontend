"use client"

import { CircleAlert, CircleCheck, FileDown, Link2Off } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { NotFoundPage } from "@/components/not-found-page"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { forgetAddressFragment, tokenInAddress } from "@/features/identity/auth/address-token"
import { AuthFrame, AuthHeading } from "@/features/identity/auth/auth-frame"
import { useInBrowser } from "@/hooks/use-in-browser"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { carryFragment } from "@/features/identity/auth/use-switch-locale"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { downloadDataCopyRequest } from "./api"

function StateIcon({ icon: Icon, tone }: { icon: typeof FileDown; tone: string }) {
  return (
    <span className={`inline-flex size-11 items-center justify-center ${tone}`}>
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}

export function DataCopyPage() {
  const inBrowser = useInBrowser()

  return inBrowser ? <DataCopyFlow /> : <AuthFrame>{null}</AuthFrame>
}

function DataCopyFlow() {
  const t = useTranslations("privacy.copy")
  const [token] = useState(tokenInAddress)
  const [outcome, setOutcome] = useState<"saved" | "invalid" | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const download = useApiMutation(downloadDataCopyRequest, { toastOnError: false })

  useEffect(forgetAddressFragment, [])

  useEffect(() => {
    carryFragment(token && outcome === null ? `#token=${encodeURIComponent(token)}` : null)

    return () => carryFragment(null)
  }, [token, outcome])

  const save = useSubmitOnce(async () => {
    if (!token) {
      return
    }

    setAlert(null)
    const result = await download.execute(token)

    if (result.ok) {
      setOutcome("saved")

      return
    }

    if (result.problem.code === "privacy.copyLinkInvalid") {
      setOutcome("invalid")

      return
    }

    setAlert(result.problem.message)
  })

  if (token === null) {
    return <NotFoundPage />
  }

  if (outcome === "saved") {
    return (
      <AuthFrame>
        <StateIcon icon={CircleCheck} tone="bg-success-soft text-success" />
        <div role="status" className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {t("savedTitle")}
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">{t("savedText")}</p>
        </div>
      </AuthFrame>
    )
  }

  if (outcome === "invalid") {
    return (
      <AuthFrame>
        <StateIcon icon={Link2Off} tone="bg-warning-soft text-warning" />
        <AuthHeading title={t("title")}>
          <p className="max-w-prose" role="alert">
            {t("linkInvalid")}
          </p>
        </AuthHeading>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame>
      <StateIcon icon={FileDown} tone="bg-muted text-muted-foreground" />
      <AuthHeading title={t("title")}>
        <p className="max-w-prose">{t("intro")}</p>
      </AuthHeading>
      {alert ? (
        <Alert variant="destructive" role="alert">
          <CircleAlert />
          <AlertDescription>{alert}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        size="lg"
        className="self-start"
        disabled={download.pending}
        onClick={() => void save()}
      >
        {download.pending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <FileDown data-icon="inline-start" />
        )}
        {t("download")}
      </Button>
    </AuthFrame>
  )
}
