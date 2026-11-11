"use client"

import { useTranslations } from "next-intl"
import { useId } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { FieldDescription, FieldError, FieldLegend, FieldSet } from "@/components/ui/field"
import { useFormat } from "@/i18n/format"

import type { RoleRow } from "./api"

export function RolesChoice({
  roles,
  selected,
  onChange,
  error,
}: {
  roles: RoleRow[]
  selected: string[]
  onChange: (ids: string[]) => void
  error?: string
}) {
  const t = useTranslations()
  const f = useFormat()
  const id = useId()

  return (
    <FieldSet data-invalid={error ? true : undefined}>
      <FieldLegend variant="label">{t("accountRequests.approve.roles")}</FieldLegend>
      <FieldDescription>{t("accountRequests.approve.rolesHint")}</FieldDescription>
      <ul className="flex flex-col divide-y border-y">
        {roles.map((role) => {
          const resources = [...new Set(role.permissions.map((p) => p.resource))]

          return (
            <li key={role.id}>
              <label
                htmlFor={`${id}-${role.id}`}
                className="flex cursor-pointer items-start gap-3 py-2.5 text-sm"
              >
                <Checkbox
                  id={`${id}-${role.id}`}
                  className="mt-0.5"
                  checked={selected.includes(role.id)}
                  onCheckedChange={(checked) =>
                    onChange(
                      checked === true
                        ? [...selected, role.id]
                        : selected.filter((roleId) => roleId !== role.id)
                    )
                  }
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">
                    <bdi>{role.name}</bdi>
                  </span>
                  {resources.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {resources
                        .map((resource) => t(`roles.permissions.resources.${resource}.name`))
                        .join(f.separator)}
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  )
}
