"use client"

import { useQuery } from "@tanstack/react-query"
import { Download, Hourglass, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { FormDialog } from "@/components/form-dialog"
import { TextAreaField } from "@/components/form-fields"
import { FormPanel } from "@/components/form-panel"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { rememberErasureScheduled } from "@/features/identity/auth/auth-outcome"
import { PasswordField } from "@/features/identity/auth/password-field"
import { useSession } from "@/features/identity/auth/session"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { useFormat } from "@/i18n/format"
import { isStale, useRefetch } from "@/lib/api/refetch"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import {
  downloadOwnDataRequest,
  ERASURE_REQUEST_QUERIES,
  erasureRequestQuery,
  requestErasureRequest,
} from "./api"

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations()
  const refetch = useRefetch()
  const { session, endSession } = useSession()
  const areas = session.status === "authenticated" ? session.areas : null
  const [password, setPassword] = useState("")
  const [note, setNote] = useState("")

  const erase = useApiMutation(requestErasureRequest, {
    onSuccess: (scheduled) => {
      rememberErasureScheduled(scheduled.erasesOn)
      endSession(routes.signInErasureScheduled())
    },
  })

  const errors = erase.fieldErrors

  const submit = useSubmitOnce(async () => {
    const trimmed = note.trim()

    const result = await erase.execute(trimmed === "" ? { password } : { password, note: trimmed })

    if (!result.ok && isStale(result.problem, ["privacy.alreadyRequested"])) {
      onClose()
      void refetch(ERASURE_REQUEST_QUERIES)
    }
  })

  return (
    <FormDialog
      role="alertdialog"
      tone="destructive"
      title={t("privacy.own.confirmTitle")}
      description={t("privacy.own.confirmText")}
      pending={erase.pending}
      problem={erase.problem}
      submitLabel={t("privacy.own.confirm")}
      onSubmit={submit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-2 text-sm">
        <ul className="flex list-disc flex-col gap-1 bg-destructive/10 py-4 ps-8 pe-4 text-destructive marker:text-muted-foreground">
          <li>{t("privacy.own.goesAccount")}</li>
          {areas?.member ? <li>{t("privacy.own.goesMember")}</li> : null}
        </ul>
        <p className="text-muted-foreground">
          {areas?.parent ? `${t("privacy.own.staysChildren")} ` : null}
          {t("privacy.own.staysTotals")}
        </p>
      </div>
      <FieldGroup>
        <PasswordField
          label={t("privacy.own.password")}
          description={t("privacy.own.passwordHint")}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <TextAreaField
          label={t("privacy.own.noteLabel")}
          description={areas?.parent ? t("privacy.own.noteHint") : undefined}
          optional
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          error={errors.note}
        />
      </FieldGroup>
    </FormDialog>
  )
}

function DeleteAccountButton() {
  const t = useTranslations("privacy.own")
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" className="shrink-0" onClick={() => setOpen(true)}>
        <Trash2 data-icon="inline-start" />
        {t("delete")}
      </Button>
      {open ? <DeleteAccountDialog onClose={() => setOpen(false)} /> : null}
    </>
  )
}

export function OwnData({ today }: { today: LocalDate }) {
  const t = useTranslations()
  const f = useFormat()
  const erasure = useQuery(erasureRequestQuery)

  const download = useApiMutation(downloadOwnDataRequest)

  const requested = erasure.data?.erasureRequested ?? null

  return (
    <FormPanel title={t("account.data")}>
      <p className="text-sm text-muted-foreground">{t("account.dataDescription")}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-prose flex-col gap-1 text-sm">
          <p className="font-medium">{t("privacy.own.copyTitle")}</p>
          <p className="text-muted-foreground">{t("privacy.own.copyText")}</p>
        </div>
        <Button
          variant="outline"
          className="shrink-0"
          disabled={download.pending}
          onClick={() => void download.execute()}
        >
          {download.pending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Download data-icon="inline-start" />
          )}
          {t("privacy.own.download")}
        </Button>
      </div>
      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-prose flex-col gap-1 text-sm">
          <p className="font-medium">{t("privacy.own.deleteTitle")}</p>
          {requested ? (
            <p role="status" className="flex items-start gap-2 text-muted-foreground">
              <Hourglass className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
              {t("privacy.own.requested", {
                when: f.atLabel(requested.receivedAt, today),
                due: f.mediumDate(requested.dueOn),
              })}
            </p>
          ) : (
            <p className="text-muted-foreground">{t("privacy.own.deleteText")}</p>
          )}
        </div>
        {erasure.isError ? (
          <span className="flex shrink-0 flex-wrap items-center gap-2 text-sm text-destructive">
            {t("errors.loadFailed")}
            <Button variant="outline" onClick={() => erasure.refetch()}>
              {t("common.retry")}
            </Button>
          </span>
        ) : null}
        {erasure.data && !requested ? <DeleteAccountButton /> : null}
      </div>
    </FormPanel>
  )
}
