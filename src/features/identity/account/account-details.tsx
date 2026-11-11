"use client"

import { useTranslations } from "next-intl"

import { FormPanel } from "@/components/form-panel"
import type { Me } from "@/features/identity/auth/api"

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
