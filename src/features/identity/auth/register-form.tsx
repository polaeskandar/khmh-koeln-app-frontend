"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { CircleAlert } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useId, useState } from "react"

import { SelectField, TextAreaField, TextField } from "@/components/form-fields"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { Link, useRouter } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { oneOf } from "@/lib/one-of"
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy"
import { routes } from "@/lib/routes"

import {
  MIN_PASSWORD_LENGTH,
  type RegisteredAs,
  registerRequest,
  registrationServicesQuery,
} from "./api"
import { rememberOutcome } from "./auth-outcome"
import { PasswordField } from "./password-field"

const SHOWN_FIELDS = [
  "account.firstName",
  "account.lastName",
  "account.email",
  "account.password",
  "registration.registeredAs",
  "registration.serviceIds",
  "registration.note",
  "privacy.accepted",
]

const KIND_VALUES: RegisteredAs[] = ["parent", "member", "servant"]

const NOTE = {
  parent: { label: "children", hint: "childrenHint" },
  member: { label: "yourGroups", hint: "yourGroupsHint" },
  servant: { label: "whereYouServe", hint: "whereYouServeHint" },
} as const

function ServiceSelect({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const t = useTranslations()
  const services = useQuery(registrationServicesQuery)

  if (services.isError) {
    return (
      <Field data-invalid>
        <FieldTitle>{t("auth.register.service")}</FieldTitle>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-destructive">{t("errors.loadFailed")}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void services.refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      </Field>
    )
  }

  return (
    <SelectField
      label={t("auth.register.service")}
      value={value}
      error={error}
      disabled={!services.data}
      onChange={(event) => onChange(event.target.value)}
    >
      <NativeSelectOption value="">
        {services.data ? t("auth.register.chooseService") : t("common.loadingEllipsis")}
      </NativeSelectOption>
      {services.data?.items.map((service) => (
        <NativeSelectOption key={service.id} value={service.id}>
          {service.name}
        </NativeSelectOption>
      ))}
    </SelectField>
  )
}

export function RegisterForm() {
  const t = useTranslations("auth.register")
  const locale = useLocale()
  const router = useRouter()
  const privacyId = useId()
  const [alert, setAlert] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    registeredAs: "parent" as RegisteredAs,
    note: "",
    serviceId: "",
    acceptPrivacy: false,
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const register = useApiMutation(registerRequest, { toastOnError: false })
  const errors = register.fieldErrors
  const servant = form.registeredAs === "servant"

  const formRef = useFocusFirstInvalid(register.problem)

  const submit = useSubmitOnce(async () => {
    setAlert(null)

    const result = await register.execute({
      account: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        language: locale,
      },
      registration: {
        registeredAs: form.registeredAs,
        note: form.note,
        serviceIds: servant && form.serviceId ? [form.serviceId] : [],
      },
      privacy: { accepted: form.acceptPrivacy, version: PRIVACY_NOTICE_VERSION },
    })

    if (result.ok) {
      rememberOutcome("registered")
      router.push(routes.registered())
    } else if (!SHOWN_FIELDS.some((field) => result.problem.fieldErrors[field])) {
      setAlert(result.problem.message)
    }
  })

  const kinds = [
    { value: "parent", title: t("asParent"), description: t("asParentHint") },
    { value: "member", title: t("asMember"), description: t("asMemberHint") },
    { value: "servant", title: t("asServant"), description: t("asServantHint") },
  ] as const

  return (
    <form
      ref={formRef}
      method="post"
      noValidate
      className="flex flex-col gap-8"
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
      <FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            label={t("firstName")}
            autoComplete="given-name"
            value={form.firstName}
            onChange={(event) => set("firstName", event.target.value)}
            error={errors["account.firstName"]}
          />
          <TextField
            label={t("lastName")}
            autoComplete="family-name"
            value={form.lastName}
            onChange={(event) => set("lastName", event.target.value)}
            error={errors["account.lastName"]}
          />
        </div>
        <TextField
          label={t("email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          value={form.email}
          onChange={(event) => set("email", event.target.value)}
          description={t("emailHint")}
          error={errors["account.email"]}
        />
        <PasswordField
          label={t("password")}
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => set("password", event.target.value)}
          description={t("passwordHint", { min: MIN_PASSWORD_LENGTH })}
          error={errors["account.password"]}
        />
      </FieldGroup>

      <FieldSet data-invalid={errors["registration.registeredAs"] ? true : undefined}>
        <FieldLegend>{t("as")}</FieldLegend>
        <RadioGroup
          value={form.registeredAs}
          onValueChange={(value) =>
            set("registeredAs", oneOf(KIND_VALUES, value) ?? form.registeredAs)
          }
          className="grid gap-3"
        >
          {kinds.map((kind) => (
            <FieldLabel
              key={kind.value}
              className={cn(
                "flex w-full cursor-pointer items-start gap-3 border p-4 text-sm font-normal tracking-normal normal-case transition-colors hover:bg-muted/50",
                form.registeredAs === kind.value && "border-primary bg-primary/5"
              )}
            >
              <RadioGroupItem value={kind.value} className="mt-0.5" />
              <span className="flex flex-col gap-1">
                <span className="font-medium">{kind.title}</span>
                <span className="text-xs text-muted-foreground">{kind.description}</span>
              </span>
            </FieldLabel>
          ))}
        </RadioGroup>
        {errors["registration.registeredAs"] ? (
          <FieldError>{errors["registration.registeredAs"]}</FieldError>
        ) : null}
      </FieldSet>

      <FieldGroup>
        {servant ? (
          <ServiceSelect
            value={form.serviceId}
            onChange={(value) => set("serviceId", value)}
            error={errors["registration.serviceIds"]}
          />
        ) : null}
        <TextAreaField
          label={t(NOTE[form.registeredAs].label)}
          description={t(NOTE[form.registeredAs].hint)}
          rows={3}
          value={form.note}
          onChange={(event) => set("note", event.target.value)}
          error={errors["registration.note"]}
        />
      </FieldGroup>

      <Field orientation="horizontal" data-invalid={errors["privacy.accepted"] ? true : undefined}>
        <Checkbox
          id={privacyId}
          checked={form.acceptPrivacy}
          onCheckedChange={(checked) => set("acceptPrivacy", checked === true)}
          aria-invalid={errors["privacy.accepted"] ? true : undefined}
        />
        <FieldContent>
          <FieldLabel
            htmlFor={privacyId}
            className="text-sm font-normal tracking-normal normal-case"
          >
            <span>
              {t.rich("privacy", {
                link: (chunks) => (
                  <Link
                    href={routes.privacy()}
                    target="_blank"
                    rel="noopener"
                    className="font-medium underline underline-offset-4"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </FieldLabel>
          <FieldDescription>{t("privacyHint")}</FieldDescription>
          {errors["privacy.accepted"] ? (
            <FieldError>{errors["privacy.accepted"]}</FieldError>
          ) : null}
        </FieldContent>
      </Field>

      <div className="flex flex-col gap-4">
        <Button type="submit" size="lg" disabled={register.pending}>
          {register.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("submit")}
        </Button>
        <p className="text-sm text-muted-foreground">
          {t.rich("haveAccount", {
            link: (chunks) => (
              <Link
                href={routes.signIn()}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </form>
  )
}
