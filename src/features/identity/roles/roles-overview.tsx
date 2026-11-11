"use client"

import { useQuery } from "@tanstack/react-query"
import { Ellipsis, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCan } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import { PERMISSION_COUNT, RESOURCES } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { type RoleRow, rolesQuery } from "./api"
import { DeleteRoleDialog } from "./delete-role-dialog"

function RoleMenu({ role }: { role: RoleRow }) {
  const t = useTranslations()
  const can = useCan()
  const [deleting, setDeleting] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("settings.roles.actionsFor", { role: role.name })}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={routes.role(role.id)}>
              {can("update", "roles") ? t("settings.roles.edit") : t("settings.roles.view")}
            </Link>
          </DropdownMenuItem>
          {can("delete", "roles") ? (
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
              {t("settings.roles.delete")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteRoleDialog
        role={role}
        holders={role.holderCount}
        open={deleting}
        onOpenChange={setDeleting}
      />
    </>
  )
}

function RolesTable({ roles }: { roles: RoleRow[] }) {
  const t = useTranslations()
  const f = useFormat()
  const can = useCan()
  const menu = can("update", "roles") || can("delete", "roles")

  return (
    <div className="overflow-x-auto border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/40">
          <tr className="border-b text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <th scope="col" className="px-3 py-2 text-start">
              {t("settings.roles.role")}
            </th>
            <th scope="col" className="px-3 py-2 text-start">
              {t("settings.roles.allows")}
            </th>
            <th scope="col" className="px-3 py-2 text-start">
              {t("settings.roles.accounts")}
            </th>
            {menu ? <th scope="col" className="w-12 px-3 py-2" /> : null}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => {
            const resources = RESOURCES.filter((resource) =>
              role.permissions.some((permission) => permission.resource === resource)
            ).map((resource) => t(`permissions.resources.${resource}.name`))

            return (
              <tr key={role.id} className="border-b last:border-b-0">
                <td className="px-3 py-3">
                  <span className="flex flex-col gap-0.5">
                    <Link
                      href={routes.role(role.id)}
                      className="font-medium hover:underline hover:underline-offset-4"
                    >
                      <bdi>{role.name}</bdi>
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {t(`settings.roles.scope.${role.scope}`)}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="flex flex-col gap-0.5">
                    <span className="tabular-nums">
                      {t("settings.roles.permissionCount", {
                        count: role.permissions.length,
                        total: PERMISSION_COUNT,
                      })}
                    </span>
                    {resources.length > 0 ? (
                      <span className="text-xs text-muted-foreground">{f.list(resources)}</span>
                    ) : null}
                  </span>
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {t("settings.roles.holders", { count: role.holderCount })}
                </td>
                {menu ? (
                  <td className="px-3 py-3 text-end">
                    <RoleMenu role={role} />
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function RolesOverview() {
  const t = useTranslations("settings.roles")
  const can = useCan()
  const query = useQuery(rolesQuery)
  const readOnly = !can("create", "roles") && !can("update", "roles") && !can("delete", "roles")

  return (
    <Section
      id="roles"
      title={t("title")}
      description={t("description")}
      actions={
        can("create", "roles") ? (
          <Button variant="outline" asChild>
            <Link href={routes.newRole()}>
              <Plus data-icon="inline-start" />
              {t("newRole")}
            </Link>
          </Button>
        ) : null
      }
    >
      <QueryState query={query}>{(data) => <RolesTable roles={data.items} />}</QueryState>
      <p className="text-sm text-muted-foreground">
        {t("global")}
        {readOnly ? <> {t("readOnly")}</> : null}
      </p>
    </Section>
  )
}
