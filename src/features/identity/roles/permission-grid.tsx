"use client"

import { useTranslations } from "next-intl"
import { useId } from "react"

import { StatusBadge } from "@/components/status"
import { Checkbox } from "@/components/ui/checkbox"
import {
  type Action,
  ACTIONS,
  type Permission,
  type Resource,
  RESOURCES,
  SENSITIVE,
} from "@/lib/permissions"

export function permissionKey(resource: Resource, action: Action) {
  return `${resource}:${action}`
}

export function permissionsOf(chosen: Set<string>): Permission[] {
  return RESOURCES.flatMap((resource) =>
    ACTIONS.filter((action) => chosen.has(permissionKey(resource, action))).map((action) => ({
      action,
      resource,
    }))
  )
}

function grant(chosen: Set<string>, resource: Resource, action: Action) {
  return new Set([...chosen, permissionKey(resource, action), permissionKey(resource, "read")])
}

function revoke(chosen: Set<string>, resource: Resource, action: Action) {
  const gone =
    action === "read"
      ? ACTIONS.map((each) => permissionKey(resource, each))
      : [permissionKey(resource, action)]

  return new Set([...chosen].filter((key) => !gone.includes(key)))
}

export function PermissionGrid({
  chosen,
  onChange,
  disabled,
}: {
  chosen: Set<string>
  onChange: (next: Set<string>) => void
  disabled: boolean
}) {
  const t = useTranslations()
  const id = useId()

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <th scope="col" className="py-2 text-start">
            {t("roleEditor.area")}
          </th>
          {ACTIONS.map((action) => (
            <th key={action} scope="col" className="w-12 py-2 text-center sm:w-16">
              {t(`permissions.actions.${action}`)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {RESOURCES.map((resource) => {
          const name = t(`permissions.resources.${resource}.name`)
          const describedBy = `${id}-${resource}`

          return (
            <tr key={resource} className="border-b align-top last:border-b-0">
              <th scope="row" className="py-3 pe-2 text-start font-normal">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {name}
                  {SENSITIVE.includes(resource) ? (
                    <StatusBadge tone="warning" title={t("roleEditor.sensitiveHint")}>
                      {t("roleEditor.sensitive")}
                    </StatusBadge>
                  ) : null}
                </span>
                <span id={describedBy} className="mt-0.5 block text-xs text-muted-foreground">
                  {t(`permissions.resources.${resource}.description`)}
                </span>
              </th>
              {ACTIONS.map((action) => (
                <td key={action} className="py-3 text-center">
                  <Checkbox
                    aria-label={t("roleEditor.cell", {
                      resource: name,
                      action: t(`permissions.actions.${action}`),
                    })}
                    aria-describedby={describedBy}
                    checked={chosen.has(permissionKey(resource, action))}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onChange(
                        checked === true
                          ? grant(chosen, resource, action)
                          : revoke(chosen, resource, action)
                      )
                    }
                  />
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
