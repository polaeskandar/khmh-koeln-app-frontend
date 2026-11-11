"use client"

import { useQuery } from "@tanstack/react-query"
import { Download, Hourglass, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { TextAreaField } from "@/components/form-fields"
import { FormPanel } from "@/components/form-panel"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { rememberErasureScheduled } from "@/features/identity/auth/auth-outcome"
import { PasswordField } from "@/features/identity/auth/password-field"
import { useSession } from "@/features/identity/auth/session"
import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"
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

function DeleteAccountForm({
  parent,
  onAlreadyRequested,
  onPendingChange,
}: {
  parent: boolean
  onAlreadyRequested: () => void
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations()
  const { endSession } = useSession()
  const [password, setPassword] = useState("")
  const [note, setNote] = useState("")

  const erase = useApiMutation(requestErasureRequest, {
    onSuccess: (scheduled) => {
      rememberErasureScheduled(scheduled.erasesOn)
      endSession(routes.signInErasureScheduled())
    },
  })

  const errors = erase.fieldErrors

  const formRef = useFocusFirstInvalid(erase.problem)

  useEffect(() => onPendingChange(erase.pending), [erase.pending, onPendingChange])

  const submit = useSubmitOnce(async () => {
    const trimmed = note.trim()

    const result = await erase.execute(trimmed === "" ? { password } : { password, note: trimmed })

    if (!result.ok && isStale(result.problem, ["privacy.alreadyRequested"])) {
      onAlreadyRequested()
    }
  })

  return (
    <form
      ref={formRef}
      method="post"
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
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
          description={parent ? t("privacy.own.noteHint") : undefined}
          optional
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          error={errors.note}
        />
      </FieldGroup>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={erase.pending}>{t("common.cancel")}</AlertDialogCancel>
        <Button type="submit" variant="destructive" disabled={erase.pending}>
          {erase.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("privacy.own.confirm")}
        </Button>
      </AlertDialogFooter>
    </form>
  )
}

function DeleteAccountDialog() {
  const t = useTranslations("privacy.own")
  const refetch = useRefetch()
  const { session } = useSession()
  const areas = session.status === "authenticated" ? session.areas : null
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="shrink-0">
          <Trash2 data-icon="inline-start" />
          {t("delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("confirmText")}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 text-sm">
          <ul className="flex list-disc flex-col gap-1 bg-destructive/10 py-4 ps-8 pe-4 text-destructive marker:text-muted-foreground">
            <li>{t("goesAccount")}</li>
            {areas?.member ? <li>{t("goesMember")}</li> : null}
          </ul>
          <p className="text-muted-foreground">
            {areas?.parent ? `${t("staysChildren")} ` : null}
            {t("staysTotals")}
          </p>
        </div>
        <DeleteAccountForm
          parent={areas?.parent ?? false}
          onPendingChange={setPending}
          onAlreadyRequested={() => {
            setOpen(false)
            void refetch(ERASURE_REQUEST_QUERIES)
          }}
        />
      </AlertDialogContent>
    </AlertDialog>
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
        {erasure.data && !requested ? <DeleteAccountDialog /> : null}
      </div>
    </FormPanel>
  )
}
