"use client"

import { CircleCheck, FileDown, Link2Off } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { FormAlert } from "@/components/form-alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AddressTokenGate } from "@/features/identity/auth/address-token"
import { AuthFrame, AuthHeading, StateIcon } from "@/features/identity/auth/auth-frame"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { tokenHash } from "@/lib/routes"

import { downloadDataCopyRequest } from "./api"

export function DataCopyPage() {
  return <AddressTokenGate>{(token) => <DataCopyFlow token={token} />}</AddressTokenGate>
}

function DataCopyFlow({ token }: { token: string }) {
  const t = useTranslations("privacy.copy")
  const [outcome, setOutcome] = useState<"saved" | "invalid" | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const download = useApiMutation(downloadDataCopyRequest, { toastOnError: false })

  const save = useSubmitOnce(async () => {
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

  if (outcome === "saved") {
    return (
      <AuthFrame>
        <StateIcon icon={CircleCheck} tone="success" />
        <AuthHeading title={t("savedTitle")} status>
          <p className="max-w-prose">{t("savedText")}</p>
        </AuthHeading>
      </AuthFrame>
    )
  }

  if (outcome === "invalid") {
    return (
      <AuthFrame>
        <StateIcon icon={Link2Off} tone="warning" />
        <AuthHeading title={t("title")}>
          <p className="max-w-prose" role="alert">
            {t("linkInvalid")}
          </p>
        </AuthHeading>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame keepHash={tokenHash(token)}>
      <StateIcon icon={FileDown} tone="muted" />
      <AuthHeading title={t("title")}>
        <p className="max-w-prose">{t("intro")}</p>
      </AuthHeading>
      <FormAlert message={alert} />
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
