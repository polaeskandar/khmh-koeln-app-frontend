"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ReactNode, useId, useState } from "react"

import { FormPanel } from "@/components/form-panel"
import { TextField } from "@/components/form-fields"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { useCan, useSession } from "@/features/identity/auth/session"
import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { nameKey } from "@/lib/domain/names"
import { oneOf } from "@/lib/one-of"
import type { Action, Resource, RoleScope } from "./api"
import { PERMISSION_COUNT } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import {
  createRoleRequest,
  type RoleDetails,
  type RoleRequest,
  rolesQuery,
  ROLE_QUERIES,
  updateRoleRequest,
} from "./api"
import { DeleteRoleDialog } from "./delete-role-dialog"
import { PermissionGrid, permissionKey, permissionsOf } from "./permission-grid"

const NAME_MAX = 80

const SCOPES: { value: RoleScope; label: "scopeChurch" | "scopeAssigned" }[] = [
  { value: "church", label: "scopeChurch" },
  { value: "assignedGroups", label: "scopeAssigned" },
]

const SCOPE_VALUES = SCOPES.map((scope) => scope.value)

function ScopeChoice({
  value,
  onChange,
  disabled,
  error,
}: {
  value: RoleScope
  onChange: (scope: RoleScope) => void
  disabled: boolean
  error: string | undefined
}) {
  const t = useTranslations("roleEditor")
  const id = useId()

  return (
    <FormPanel title={t("scope")}>
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(oneOf(SCOPE_VALUES, next) ?? value)}
        disabled={disabled}
        aria-label={t("scope")}
        className="flex flex-col gap-2"
      >
        {SCOPES.map((option) => (
          <label
            key={option.value}
            htmlFor={`${id}-${option.value}`}
            className={cn(
              "flex w-full items-start gap-3 border p-3 text-sm",
              value === option.value && "border-primary bg-primary/5",
              disabled ? "cursor-default" : "cursor-pointer"
            )}
          >
            <RadioGroupItem id={`${id}-${option.value}`} value={option.value} className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{t(option.label)}</span>
              <span className="text-xs text-pretty text-muted-foreground">
                {t(`${option.label}Hint`)}
              </span>
            </span>
          </label>
        ))}
      </RadioGroup>
      {error ? <FieldError>{error}</FieldError> : null}
    </FormPanel>
  )
}
function Holders({ role }: { role: RoleDetails | null }) {
  const t = useTranslations("roleEditor")
  const f = useFormat()
  const { session } = useSession()
  const today = session.status === "authenticated" ? session.me.today : null

  const staff = (chunks: ReactNode) => (
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
          {today ? (
            <p className="text-xs text-muted-foreground">
              {role.updatedAt !== role.createdAt
                ? t("changed", { when: f.atLabel(role.updatedAt, today) })
                : t("added", { when: f.atLabel(role.createdAt, today) })}
            </p>
          ) : null}
        </>
      )}
    </FormPanel>
  )
}

function useSaveRole(role: RoleDetails | null, name: string) {
  const t = useTranslations("toast")
  const router = useRouter()

  return useApiMutation(
    (input: RoleRequest) => (role ? updateRoleRequest(role.id, input) : createRoleRequest(input)),
    {
      successMessage: role ? t("roleSaved") : t("roleCreated", { name: name.trim() }),
      invalidate: ROLE_QUERIES,
      onSuccess: role ? undefined : (saved) => router.push(routes.role(saved.id)),
    }
  )
}

export function RoleForm({ role }: { role: RoleDetails | null }) {
  const t = useTranslations()
  const router = useRouter()
  const can = useCan()
  const others = useQuery(rolesQuery)
  const [name, setName] = useState(role?.name ?? "")

  const [chosen, setChosen] = useState(
    () => new Set((role?.permissions ?? []).map((p) => permissionKey(p.resource, p.action)))
  )

  const [scope, setScope] = useState<RoleScope>(role?.scope ?? "church")
  const [deleting, setDeleting] = useState(false)
  const editable = role ? can("update", "roles") : can("create", "roles")

  const save = useSaveRole(role, name)

  const taken = (others.data?.items ?? []).find(
    (other) => other.id !== role?.id && nameKey(other.name) === nameKey(name)
  )

  const has = (resource: Resource, action: Action) => chosen.has(permissionKey(resource, action))
  const opensNothing = !has("services", "read") && !has("parentPortal", "read")
  const locksOut = role?.onlyWayToChangeRoles === true && !has("roles", "update")

  const blocked = !name.trim() || taken !== undefined || save.pending

  const formRef = useFocusFirstInvalid(save.problem)

  const submit = useSubmitOnce(
    () => save.execute({ name, scope, permissions: permissionsOf(chosen) }),
    {
      keepLocked: (result) => result.ok && !role,
    }
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <form
        ref={formRef}
        noValidate
        className="flex min-w-0 flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault()

          if (!blocked) {
            void submit()
          }
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
        <ScopeChoice
          value={scope}
          onChange={setScope}
          disabled={!editable}
          error={save.fieldErrors.scope}
        />
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
        <DeleteRoleDialog
          role={role}
          holders={role.holders.length}
          open={deleting}
          onOpenChange={setDeleting}
          onDeleted={() => router.push(`${routes.settings()}#roles`)}
        />
      ) : null}
    </div>
  )
}
