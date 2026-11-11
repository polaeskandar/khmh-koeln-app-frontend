"use client"

import { KeyRound } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { DialogMount } from "@/components/dialog-mount"
import { FormDialog } from "@/components/form-dialog"
import { FormPanel } from "@/components/form-panel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { MIN_PASSWORD_LENGTH } from "@/features/identity/auth/api"
import { PasswordField } from "@/features/identity/auth/password-field"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { changePasswordRequest } from "./api"

function PasswordDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("account.password")
  const [currentPassword, setCurrent] = useState("")
  const [newPassword, setNew] = useState("")

  const mutation = useApiMutation(changePasswordRequest, {
    successMessage: t("saved"),
    toastOnError: false,
    onSuccess: onClose,
  })

  const errors = mutation.fieldErrors

  const problem =
    mutation.problem && Object.keys(errors).length === 0 ? mutation.problem.message : null

  const submit = useSubmitOnce(async () => {
    await mutation.execute({ currentPassword, newPassword })
  })

  return (
    <FormDialog
      title={t("submit")}
      description={t("intro")}
      pending={mutation.pending}
      problem={mutation.problem}
      submitLabel={t("submit")}
      onSubmit={submit}
      onClose={onClose}
    >
      {problem ? (
        <Alert variant="destructive">
          <AlertDescription>{problem}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <PasswordField
          label={t("current")}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrent(event.target.value)}
          error={errors.currentPassword}
        />
        <PasswordField
          label={t("new")}
          autoComplete="new-password"
          value={newPassword}
          description={t("newHint", { min: MIN_PASSWORD_LENGTH })}
          onChange={(event) => setNew(event.target.value)}
          error={errors.newPassword}
        />
      </FieldGroup>
    </FormDialog>
  )
}

export function PasswordSection() {
  const t = useTranslations("account.password")
  const [open, setOpen] = useState(false)

  return (
    <FormPanel title={t("title")}>
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      <Button variant="outline" className="self-start" onClick={() => setOpen(true)}>
        <KeyRound data-icon="inline-start" />
        {t("submit")}…
      </Button>
      <DialogMount open={open}>
        <PasswordDialog onClose={() => setOpen(false)} />
      </DialogMount>
    </FormPanel>
  )
}
