"use client"

import { useTranslations } from "next-intl"

import { TextField } from "@/components/form-fields"
import { FieldGroup } from "@/components/ui/field"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import { PasswordField } from "./password-field"

export function CredentialsFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
}: {
  email: string
  password: string
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
}) {
  const t = useTranslations("auth.signIn")

  return (
    <FieldGroup>
      <TextField
        label={t("email")}
        type="email"
        name="email"
        autoComplete="username"
        inputMode="email"
        dir="ltr"
        required
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
      />
      <PasswordField
        label={t("password")}
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        labelExtra={
          <Link
            href={routes.forgotPassword()}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("forgot")}
          </Link>
        }
      />
    </FieldGroup>
  )
}
