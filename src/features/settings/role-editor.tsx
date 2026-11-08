"use client"

import { useQuery } from "@tanstack/react-query"
import { TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useRef, useState } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { FormPanel } from "@/components/form-panel"
import { TextField } from "@/components/form-fields"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader } from "@/components/page-header"
import { NotFoundState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { StatusBadge } from "@/components/status"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { useCan } from "@/features/auth/session"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { nameKey } from "@/lib/domain/names"
import {
  type Action,
  ACTIONS,
  type Permission,
  PERMISSION_COUNT,
  type Resource,
  RESOURCES,
  SENSITIVE,
} from "@/lib/permissions"
import { routes } from "@/lib/routes"

import {
  createRoleRequest,
  deleteRoleRequest,
  type RoleDetail,
  type RoleInput,
  roleListQuery,
  roleQuery,
  updateRoleRequest,
} from "./api"

const NAME_MAX = 80
const key = (p: Permission) => `${p.resource}:${p.action}`

function toggle(chosen: Set<string>, resource: Resource, action: Action, on: boolean) {
  const next = new Set(chosen)

  if (action === "read" && !on) {
    for (const a of ACTIONS) {
      next.delete(`${resource}:${a}`)
    }
  } else if (on) {
    next.add(`${resource}:${action}`)
    next.add(`${resource}:read`)
  } else {
    next.delete(`${resource}:${action}`)
  }

  return next
}

function PermissionGrid({
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
                    checked={chosen.has(`${resource}:${action}`)}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onChange(toggle(chosen, resource, action, checked === true))
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

function Holders({ role }: { role: RoleDetail | null }) {
  const t = useTranslations("roleEditor")
  const f = useFormat()

  const staff = (chunks: React.ReactNode) => (
    <Link href={`${routes.settings()}#users`} className="underline underline-offset-4">
      {chunks}
    </Link>
  )

  return (
    <FormPanel title={t("holdersTitle")} className="gap-3">
      {!role ? (
        <p className="text-sm text-muted-foreground">{t.rich("holdersNew", { link: staff })}</p>
      ) : (
        <>
          <p className="text-sm">{t("applyCount", { count: role.holders.length })}</p>
          {role.holders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.rich("holdersNone", { link: staff })}
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {role.holders.map((holder) => (
                <li key={holder.id} className="flex flex-col">
                  <span>
                    <bdi className="font-medium">{holder.displayName}</bdi>
                    {holder.disabled ? (
                      <span className="text-muted-foreground"> · {t("disabledAccount")}</span>
                    ) : null}
                  </span>
                  <span dir="ltr" className="text-start text-xs text-muted-foreground">
                    {holder.email}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            {role.updatedAt !== role.createdAt
              ? t("changed", { when: f.atLabel(role.updatedAt, f.instantDate(role.updatedAt)) })
              : t("added", { when: f.atLabel(role.createdAt, f.instantDate(role.createdAt)) })}
          </p>
        </>
      )}
    </FormPanel>
  )
}

function RoleForm({ role }: { role: RoleDetail | null }) {
  const t = useTranslations()
  const router = useRouter()
  const can = useCan()
  const others = useQuery(roleListQuery)
  const [name, setName] = useState(role?.name ?? "")
  const [chosen, setChosen] = useState(() => new Set((role?.permissions ?? []).map(key)))
  const [deleting, setDeleting] = useState(false)
  const busy = useRef(false)
  const editable = role ? can("update", "roles") : can("create", "roles")

  const create = useApiMutation(createRoleRequest, {
    successMessage: t("toast.roleCreated", { name: name.trim() }),
    invalidate: [["roles"], ["staff-accounts"], ["me"]],
    onSuccess: (saved) => router.push(routes.role(saved.id)),
  })

  const update = useApiMutation((input: RoleInput) => updateRoleRequest(role?.id ?? "", input), {
    successMessage: t("toast.roleSaved"),
    invalidate: [["roles"], ["staff-accounts"], ["me"]],
  })

  const save = role ? update : create

  const remove = useApiMutation(deleteRoleRequest, {
    successMessage: t("toast.roleDeleted", { name: role?.name ?? "" }),
    invalidate: [["roles"], ["staff-accounts"], ["me"]],
    onSuccess: () => router.push(`${routes.settings()}#roles`),
  })

  const taken = (others.data?.items ?? []).find(
    (other) => other.id !== role?.id && nameKey(other.name) === nameKey(name)
  )

  const has = (resource: Resource, action: Action) => chosen.has(`${resource}:${action}`)
  const opensNothing = !has("services", "read") && !has("parentPortal", "read")
  const locksOut = role?.onlyWayToChangeRoles === true && !has("roles", "update")

  const permissions: Permission[] = RESOURCES.flatMap((resource) =>
    ACTIONS.filter((action) => has(resource, action)).map((action) => ({ action, resource }))
  )

  const blocked = !name.trim() || taken !== undefined || save.pending

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <form
        noValidate
        className="flex min-w-0 flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault()

          if (blocked || busy.current) {
            return
          }

          busy.current = true

          void save.execute({ name, permissions }).then((result) => {
            if (!result.ok || role) {
              busy.current = false
            }
          })
        }}
      >
        {!editable ? (
          <p className="border border-dashed p-4 text-sm text-muted-foreground">
            {t("roleEditor.readOnlyNote")}
          </p>
        ) : null}
        <FormPanel title={t("roleEditor.details")}>
          <TextField
            label={t("roleEditor.name")}
            dir="auto"
            value={name}
            maxLength={NAME_MAX}
            disabled={!editable}
            description={taken ? undefined : t("roleEditor.nameHint")}
            error={
              taken
                ? t("roleEditor.nameTaken", { name: isolate(taken.name) })
                : save.fieldErrors.name
            }
            onChange={(event) => setName(event.target.value)}
          />
        </FormPanel>
        <FormPanel
          title={t("roleEditor.permissions")}
          note={
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("roleEditor.chosen", { count: chosen.size, total: PERMISSION_COUNT })}
            </span>
          }
        >
          <p className="text-xs text-muted-foreground">{t("roleEditor.permissionsHint")}</p>
          {opensNothing ? (
            <Alert>
              <TriangleAlert />
              <AlertDescription>{t("roleEditor.opensNothing")}</AlertDescription>
            </Alert>
          ) : null}
          {locksOut ? (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertDescription>{t("roleEditor.locksOut")}</AlertDescription>
            </Alert>
          ) : null}
          <PermissionGrid chosen={chosen} onChange={setChosen} disabled={!editable} />
        </FormPanel>
        {editable || (role && can("delete", "roles")) ? (
          <div className="flex flex-wrap gap-2">
            {editable ? (
              <Button type="submit" disabled={blocked}>
                {save.pending ? <Spinner data-icon="inline-start" /> : null}
                {role ? t("roleEditor.save") : t("roleEditor.create")}
              </Button>
            ) : null}
            {role && can("delete", "roles") ? (
              <Button type="button" variant="outline" onClick={() => setDeleting(true)}>
                {t("roleEditor.deleteRole")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
      <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
        <Holders role={role} />
      </aside>
      {role ? (
        <ConfirmDialog
          open={deleting}
          onOpenChange={setDeleting}
          title={t("settings.roles.deleteTitle", { name: isolate(role.name) })}
          description={t("settings.roles.deleteDescription", { count: role.holders.length })}
          confirmLabel={t("settings.roles.deleteConfirm")}
          tone="destructive"
          onConfirm={async () => (await remove.execute(role.id)).ok}
        />
      ) : null}
    </div>
  )
}

function EditorPage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const t = useTranslations()

  return (
    <>
      <Topbar
        crumbs={[
          { label: t("nav.settings"), href: routes.settings() },
          { label: t("roleEditor.roles"), href: `${routes.settings()}#roles` },
          { label: title },
        ]}
      />
      <PageBody>
        <PageHeader title={title} description={description} />
        {children}
      </PageBody>
    </>
  )
}

function NoRoles() {
  const t = useTranslations("roleEditor")

  return (
    <PageBody>
      <NoAccess title={t("noAccess")}>{t("noAccessHint")}</NoAccess>
    </PageBody>
  )
}

function NotFoundPage() {
  const t = useTranslations("nav")

  return (
    <>
      <Topbar crumbs={[{ label: t("settings"), href: routes.settings() }]} />
      <NotFoundState home={routes.settings()} />
    </>
  )
}

function ExistingRole({ id }: { id: string }) {
  const t = useTranslations("roleEditor")
  const query = useQuery(roleQuery(id))

  return (
    <QueryState query={query} notFound={<NotFoundPage />}>
      {(role) => (
        <EditorPage title={role.name} description={t("description")}>
          <RoleForm role={role} />
        </EditorPage>
      )}
    </QueryState>
  )
}

export function RolePage() {
  const can = useCan()

  if (!can("read", "roles")) {
    return <NoRoles />
  }

  return <RecordPage notFound={<NotFoundPage />}>{(id) => <ExistingRole id={id} />}</RecordPage>
}

export function NewRolePage() {
  const t = useTranslations("roleEditor")
  const can = useCan()

  if (!can("create", "roles")) {
    return <NoRoles />
  }

  return (
    <EditorPage title={t("titleNew")} description={t("descriptionNew")}>
      <RoleForm role={null} />
    </EditorPage>
  )
}
