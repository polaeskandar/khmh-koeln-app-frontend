"use client"

import { useQuery } from "@tanstack/react-query"
import { KeyRound, Plus, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Section } from "@/components/page-header"
import { QueryErrorState, QueryState } from "@/components/page-states"
import { StatusBadge } from "@/components/status"
import { Button } from "@/components/ui/button"
import { useCan, useCanAssign } from "@/features/identity/auth/session"
import type { GroupOption } from "@/features/organization/assignments/api"
import {
  AssignGroupDialog,
  AssignmentChip,
  useAssignableGroups,
} from "@/features/organization/assignments/group-choice"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { groupAt } from "@/lib/permissions"

import {
  passwordLinkRequest,
  removeRoleRequest,
  type StaffAccount,
  staffAccountsQuery,
} from "./api"
import { GiveRoleDialog } from "./give-role-dialog"
import { PasswordLinkDialog } from "./password-link-dialog"
import { type Role, rolesQuery, ROLE_QUERIES } from "@/features/identity/roles/api"

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

function AccountRoles({
  account,
  canChange,
  canAdd,
  onAdd,
}: {
  account: StaffAccount
  canChange: boolean
  canAdd: boolean
  onAdd: () => void
}) {
  const t = useTranslations()

  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {account.roles.length === 0 ? (
        <li className="text-xs text-muted-foreground">{t("roles.summary.none")}</li>
      ) : (
        account.roles.map((role) => (
          <RoleChip key={role.id} account={account} role={role} canChange={canChange} />
        ))
      )}
      {canAdd ? (
        <li>
          <Button variant="ghost" size="xs" onClick={onAdd}>
            <Plus data-icon="inline-start" />
            {t("settings.users.addRole")}
          </Button>
        </li>
      ) : null}
    </ul>
  )
}

function AccountGroups({
  account,
  needsGroups,
  canAdd,
  onAdd,
}: {
  account: StaffAccount
  needsGroups: boolean
  canAdd: boolean
  onAdd: () => void
}) {
  const t = useTranslations("settings.users")
  const canAssign = useCanAssign()
  const open = !account.disabled

  if (account.assignments.length === 0 && !(open && (needsGroups || canAdd))) {
    return null
  }

  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {account.assignments.map((assignment) => (
        <AssignmentChip
          key={assignment.id}
          account={account}
          assignment={assignment}
          removable={canAssign(groupAt(assignment.service, assignment.stage))}
        />
      ))}
      {account.assignments.length === 0 && needsGroups && open ? (
        <li className="text-xs text-muted-foreground">{t("noGroups")}</li>
      ) : null}
      {canAdd && open ? (
        <li>
          <Button
            variant="ghost"
            size="xs"
            aria-label={t("addGroupLabel", { name: account.displayName })}
            onClick={onAdd}
          >
            <Plus data-icon="inline-start" />
            {t("addGroup")}
          </Button>
        </li>
      ) : null}
    </ul>
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
  const [dialog, setDialog] = useState<"role" | "group" | "link" | null>(null)
  const passwordLink = useApiMutation(passwordLinkRequest, { toastOnError: false })
  const left = roles.filter((role) => !account.roles.some((had) => had.id === role.id))

  function sendPasswordLink() {
    setDialog("link")
    void passwordLink.execute(account.id)
  }

  const needsGroups = account.roles.some(
    (held) => roles.find((role) => role.id === held.id)?.scope === "assignedGroups"
  )

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
        <AccountRoles
          account={account}
          canChange={changeRoles}
          canAdd={changeRoles && left.length > 0}
          onAdd={() => setDialog("role")}
        />
        <AccountGroups
          account={account}
          needsGroups={needsGroups}
          canAdd={groups.length > 0}
          onAdd={() => setDialog("group")}
        />
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
        <GiveRoleDialog account={account} roles={left} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === "group" ? (
        <AssignGroupDialog account={account} services={groups} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === "link" ? (
        <PasswordLinkDialog
          account={account}
          today={today}
          link={passwordLink.data}
          pending={passwordLink.pending}
          problem={passwordLink.problem}
          onClose={() => setDialog(null)}
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
