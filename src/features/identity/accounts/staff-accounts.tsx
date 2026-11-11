"use client"

import { useQuery } from "@tanstack/react-query"
import { KeyRound, Plus, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Section } from "@/components/page-header"
import { QueryErrorState, QueryState } from "@/components/page-states"
import { StatusBadge } from "@/components/status"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { useCan, useCanAssign } from "@/features/identity/auth/session"
import type { GroupOption } from "@/features/organization/assignments/api"
import {
  AssignGroupDialog,
  AssignmentChip,
  useAssignableGroups,
} from "@/features/organization/assignments/group-choice"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import { isStale, useRefetch } from "@/lib/api/refetch"
import type { Problem } from "@/lib/api/translate-problem"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { groupAt } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import {
  giveRoleRequest,
  type PasswordLink,
  passwordLinkRequest,
  removeRoleRequest,
  type StaffAccount,
  STAFF_ACCOUNT_QUERIES,
  staffAccountsQuery,
} from "./api"
import { type Role, rolesQuery, ROLE_QUERIES } from "@/features/identity/roles/api"

function GiveRoleDialog({
  account,
  roles,
  onOpenChange,
}: {
  account: StaffAccount
  roles: Role[]
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations()
  const refetch = useRefetch()
  const [roleId, setRoleId] = useState("")

  const give = useApiMutation((id: string) => giveRoleRequest(account.id, id), {
    successMessage: t("toast.roleAssigned"),
    invalidate: ROLE_QUERIES,
    onSuccess: () => onOpenChange(false),
  })

  async function submit() {
    const result = await give.execute(roleId)

    if (!result.ok && isStale(result.problem, [409])) {
      void refetch(STAFF_ACCOUNT_QUERIES)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open onOpenChange={(next) => (next || !give.pending) && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("settings.users.assign.title", { name: isolate(account.displayName) })}
          </DialogTitle>
          <DialogDescription>{t("settings.users.assign.description")}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()

            if (roleId) {
              void submit()
            }
          }}
        >
          <Field data-invalid={give.fieldErrors.roleId ? true : undefined}>
            <FieldLabel htmlFor="give-role">{t("settings.users.assign.role")}</FieldLabel>
            <NativeSelect
              id="give-role"
              className="w-full"
              value={roleId}
              aria-invalid={give.fieldErrors.roleId ? true : undefined}
              onChange={(event) => setRoleId(event.target.value)}
            >
              <NativeSelectOption value="" disabled>
                {t("settings.users.assign.choose")}
              </NativeSelectOption>
              {roles.map((role) => (
                <NativeSelectOption key={role.id} value={role.id}>
                  {role.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {give.fieldErrors.roleId ? (
              <FieldError>{give.fieldErrors.roleId}</FieldError>
            ) : (
              <FieldDescription>
                {t.rich("settings.users.assign.roleHint", {
                  link: (chunks) => (
                    <Link
                      href={`${routes.settings()}#roles`}
                      className="underline underline-offset-4"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </FieldDescription>
            )}
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={give.pending}
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!roleId || give.pending}>
              {give.pending ? <Spinner data-icon="inline-start" /> : null}
              {t("settings.users.assign.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PasswordLinkDialog({
  account,
  today,
  link,
  problem,
  onOpenChange,
}: {
  account: StaffAccount
  today: LocalDate
  link: PasswordLink | undefined
  problem: Problem | null
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations()
  const f = useFormat()

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("settings.users.passwordLink.title", { name: isolate(account.displayName) })}
          </DialogTitle>
          <DialogDescription>
            {t("settings.users.passwordLink.description", {
              name: isolate(account.displayName),
            })}
          </DialogDescription>
        </DialogHeader>
        {problem ? (
          <Alert variant="destructive">
            <AlertDescription>{problem.message}</AlertDescription>
          </Alert>
        ) : link ? (
          <p className="text-sm text-muted-foreground" role="status">
            {t("settings.users.passwordLink.sent", { email: account.email })}{" "}
            {t("settings.users.passwordLink.expires", {
              when: f.atLabel(link.expiresAt, today),
            })}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Spinner />
            {t("settings.users.passwordLink.creating")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RoleChip({
  account,
  role,
  canChange,
}: {
  account: StaffAccount
  role: StaffAccount["roles"][number]
  canChange: boolean
}) {
  const t = useTranslations()
  const [removing, setRemoving] = useState(false)

  const remove = useApiMutation(() => removeRoleRequest(account.id, role.id), {
    successMessage: t("toast.roleRemoved"),
    invalidate: ROLE_QUERIES,
  })

  return (
    <li className="inline-flex items-center gap-1 border px-2 py-0.5 text-xs">
      <bdi>{role.name}</bdi>
      {canChange ? (
        <>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label={t("settings.users.removeRoleLabel", {
              role: role.name,
              name: account.displayName,
            })}
            onClick={() => setRemoving(true)}
          >
            <X className="size-3" />
          </button>
          <ConfirmDialog
            open={removing}
            onOpenChange={setRemoving}
            title={t("settings.users.removeTitle", {
              role: isolate(role.name),
              name: isolate(account.displayName),
            })}
            description={t("settings.users.removeDescription")}
            confirmLabel={t("settings.users.remove")}
            tone="destructive"
            onConfirm={async () => (await remove.execute()).ok}
          />
        </>
      ) : null}
    </li>
  )
}

function AccountRow({
  account,
  roles,
  groups,
  changeRoles,
  sendLinks,
  today,
}: {
  account: StaffAccount
  roles: Role[]
  groups: GroupOption[]
  changeRoles: boolean
  sendLinks: boolean
  today: LocalDate
}) {
  const t = useTranslations()
  const canAssign = useCanAssign()
  const [dialog, setDialog] = useState<"role" | "group" | "link" | null>(null)
  const passwordLink = useApiMutation(passwordLinkRequest, { toastOnError: false })
  const left = roles.filter((role) => !account.roles.some((had) => had.id === role.id))
  const close = (open: boolean) => !open && setDialog(null)

  function sendPasswordLink() {
    setDialog("link")
    void passwordLink.execute(account.id)
  }

  const needsGroups = account.roles.some(
    (held) => roles.find((role) => role.id === held.id)?.scope === "assignedGroups"
  )

  const offersGroups = !account.disabled && (needsGroups || groups.length > 0)

  return (
    <li className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between">
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-2 text-sm">
          <bdi className="font-medium">{account.displayName}</bdi>
          {account.disabled ? (
            <StatusBadge tone="muted">{t("settings.members.disabled")}</StatusBadge>
          ) : null}
        </span>
        <span dir="ltr" className="text-start text-xs text-muted-foreground">
          {account.email}
        </span>
        <ul className="flex flex-wrap items-center gap-1.5">
          {account.roles.length === 0 ? (
            <li className="text-xs text-muted-foreground">{t("roles.summary.none")}</li>
          ) : (
            account.roles.map((role) => (
              <RoleChip key={role.id} account={account} role={role} canChange={changeRoles} />
            ))
          )}
          {changeRoles && left.length > 0 ? (
            <li>
              <Button variant="ghost" size="xs" onClick={() => setDialog("role")}>
                <Plus data-icon="inline-start" />
                {t("settings.users.addRole")}
              </Button>
            </li>
          ) : null}
        </ul>
        {account.assignments.length > 0 || offersGroups ? (
          <ul className="flex flex-wrap items-center gap-1.5">
            {account.assignments.map((assignment) => (
              <AssignmentChip
                key={assignment.id}
                account={account}
                assignment={assignment}
                removable={canAssign(groupAt(assignment.service, assignment.stage))}
              />
            ))}
            {account.assignments.length === 0 && needsGroups && !account.disabled ? (
              <li className="text-xs text-muted-foreground">{t("settings.users.noGroups")}</li>
            ) : null}
            {groups.length > 0 && !account.disabled ? (
              <li>
                <Button
                  variant="ghost"
                  size="xs"
                  aria-label={t("settings.users.addGroupLabel", { name: account.displayName })}
                  onClick={() => setDialog("group")}
                >
                  <Plus data-icon="inline-start" />
                  {t("settings.users.addGroup")}
                </Button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </span>
      {sendLinks ? (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          disabled={account.disabled}
          onClick={sendPasswordLink}
        >
          <KeyRound data-icon="inline-start" />
          {t("settings.users.passwordLink.action")}
        </Button>
      ) : null}
      {dialog === "role" ? (
        <GiveRoleDialog account={account} roles={left} onOpenChange={close} />
      ) : null}
      {dialog === "group" ? (
        <AssignGroupDialog account={account} services={groups} onOpenChange={close} />
      ) : null}
      {dialog === "link" ? (
        <PasswordLinkDialog
          account={account}
          today={today}
          link={passwordLink.data}
          problem={passwordLink.problem}
          onOpenChange={close}
        />
      ) : null}
    </li>
  )
}

export function StaffAccounts() {
  const t = useTranslations("settings.users")
  const can = useCan()
  const changeRoles = can("update", "roles")
  const sendLinks = can("update", "users")
  const accounts = useQuery(staffAccountsQuery)
  const roles = useQuery({ ...rolesQuery, enabled: changeRoles })
  const groups = useAssignableGroups()

  return (
    <Section
      id="users"
      title={t("title")}
      description={
        changeRoles || sendLinks || groups.length > 0 ? t("description") : t("descriptionReadOnly")
      }
    >
      {roles.isError ? (
        <QueryErrorState error={roles.error} onRetry={() => roles.refetch()} />
      ) : null}
      <QueryState query={accounts}>
        {(data) => (
          <ul className="flex flex-col divide-y border-y">
            {data.items.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                roles={roles.data?.items ?? []}
                groups={groups}
                changeRoles={changeRoles}
                sendLinks={sendLinks}
                today={data.today}
              />
            ))}
          </ul>
        )}
      </QueryState>
    </Section>
  )
}
