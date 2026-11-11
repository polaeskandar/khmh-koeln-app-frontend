"use client"

import { KeyRound } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useId, useState } from "react"

import { FormPanel } from "@/components/form-panel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { AppearanceFields } from "@/components/theme-switch"
import { type Me, MIN_PASSWORD_LENGTH } from "@/features/identity/auth/api"
import { PasswordField } from "@/features/identity/auth/password-field"
import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { isLocale, LOCALE_NAMES, LOCALES } from "@/i18n/config"
import { useSwitchLocale } from "@/i18n/use-switch-locale"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { changePasswordRequest } from "./api"

export function AccountDetails({ me }: { me: Me }) {
  const t = useTranslations("account")

  return (
    <FormPanel title={t("details")}>
      <dl className="grid gap-4 text-sm sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
        <dt className="text-muted-foreground">{t("name")}</dt>
        <dd dir="auto" className="font-medium">
          {me.account.displayName}
        </dd>
        <dt className="text-muted-foreground">{t("email")}</dt>
        <dd dir="ltr" className="text-start break-all">
          {me.account.email}
        </dd>
        {me.roles.length > 0 ? (
          <>
            <dt className="text-muted-foreground">{t("roles")}</dt>
            <dd>
              <ul className="flex flex-col gap-1">
                {me.roles.map((role) => (
                  <li key={role.id}>
                    <bdi>{role.name}</bdi>
                  </li>
                ))}
              </ul>
            </dd>
          </>
        ) : null}
      </dl>
      <p className="text-xs text-muted-foreground">{t("detailsHint")}</p>
    </FormPanel>
  )
}

function LanguageFields() {
  const t = useTranslations("prefs")
  const locale = useLocale()
  const switchLocale = useSwitchLocale()
  const id = useId()

  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
      <span id={id} className="text-sm font-medium">
        {t("language")}
      </span>
      <RadioGroup
        value={locale}
        onValueChange={(value) => isLocale(value) && value !== locale && switchLocale(value)}
        className="flex flex-wrap gap-4"
      >
        {LOCALES.map((l) => (
          <span key={l} className="flex items-center gap-2">
            <RadioGroupItem id={`${id}-${l}`} value={l} />
            <FieldLabel htmlFor={`${id}-${l}`} lang={l} className="font-normal">
              {LOCALE_NAMES[l]}
            </FieldLabel>
          </span>
        ))}
      </RadioGroup>
    </div>
  )
}

export function PreferencesFields() {
  return (
    <div className="flex flex-col gap-6">
      <LanguageFields />
      <AppearanceFields />
    </div>
  )
}

function PasswordForm({
  onDone,
  onPendingChange,
}: {
  onDone: () => void
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("account.password")
  const tCommon = useTranslations("common")
  const [currentPassword, setCurrent] = useState("")
  const [newPassword, setNew] = useState("")

  const mutation = useApiMutation(changePasswordRequest, {
    successMessage: t("saved"),
    toastOnError: false,
    onSuccess: onDone,
  })

  const errors = mutation.fieldErrors

  const problem =
    mutation.problem && Object.keys(errors).length === 0 ? mutation.problem.message : null

  const formRef = useFocusFirstInvalid(mutation.problem)

  useEffect(() => onPendingChange(mutation.pending), [mutation.pending, onPendingChange])

  const submit = useSubmitOnce(async () => {
    await mutation.execute({ currentPassword, newPassword })
  })

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
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
      <DialogFooter>
        <Button type="button" variant="outline" disabled={mutation.pending} onClick={onDone}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={mutation.pending}>
          {mutation.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("submit")}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function PasswordSection() {
  const t = useTranslations("account.password")
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  return (
    <FormPanel title={t("title")}>
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      <Dialog open={open} onOpenChange={(next) => (next || !pending) && setOpen(next)}>
        <DialogTrigger asChild>
          <Button variant="outline" className="self-start">
            <KeyRound data-icon="inline-start" />
            {t("submit")}…
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("submit")}</DialogTitle>
            <DialogDescription>{t("intro")}</DialogDescription>
          </DialogHeader>
          <PasswordForm onDone={() => setOpen(false)} onPendingChange={setPending} />
        </DialogContent>
      </Dialog>
    </FormPanel>
  )
}
