"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"

import { MemberAvatar } from "@/components/member-avatar"
import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { type StaffAccount, staffAccountsQuery } from "@/features/identity/accounts/api"
import { initialsOf } from "@/features/identity/auth/role-summary"
import { useCanAssign } from "@/features/identity/auth/session"
import {
  ASSIGNMENT_QUERIES,
  assignRequest,
  type GroupOption,
  whereOf,
} from "@/features/organization/assignments/api"
import { AssignmentChip, GroupFields } from "@/features/organization/assignments/group-choice"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { type Group, groupAt } from "@/lib/permissions"

function AssignServantDialog({
  service,
  accounts,
  onOpenChange,
}: {
  service: GroupOption
  accounts: StaffAccount[]
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations()
  const id = useId()
  const [accountId, setAccountId] = useState("")
  const [stageId, setStageId] = useState<string | null>(null)
  const account = accounts.find((option) => option.id === accountId)

  const assign = useApiMutation((chosen: string, group: Group) => assignRequest(chosen, group), {
    successMessage: (assignment) =>
      t("toast.groupAssigned", {
        name: isolate(account?.displayName ?? ""),
        where: isolate(whereOf(assignment)),
      }),
    invalidate: ASSIGNMENT_QUERIES,
    onSuccess: () => onOpenChange(false),
  })

  return (
    <Dialog open onOpenChange={(next) => (next || !assign.pending) && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("services.detail.servants.dialog.title", { service: isolate(service.name) })}
          </DialogTitle>
          <DialogDescription>{t("assignments.dialog.description")}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()

            if (accountId) {
              void assign.execute(accountId, { serviceId: service.id, stageId })
            }
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${id}-account`}>
                {t("services.detail.servants.dialog.account")}
              </FieldLabel>
              <NativeSelect
                id={`${id}-account`}
                className="w-full"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
              >
                <NativeSelectOption value="" disabled>
                  {t("services.detail.servants.dialog.chooseAccount")}
                </NativeSelectOption>
                {accounts.map((option) => (
                  <NativeSelectOption key={option.id} value={option.id}>
                    {option.displayName}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <GroupFields
              services={[service]}
              value={{ serviceId: service.id, stageId }}
              onChange={(group) => setStageId(group.stageId)}
              errors={assign.fieldErrors}
              fixedService
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={assign.pending}
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!accountId || assign.pending}>
              {assign.pending ? <Spinner data-icon="inline-start" /> : null}
              {t("assignments.assign")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ServantRows({ service, accounts }: { service: GroupOption; accounts: StaffAccount[] }) {
  const t = useTranslations()
  const canAssign = useCanAssign()

  const servants = accounts.flatMap((account) => {
    const here = account.assignments.filter((assignment) => assignment.service.id === service.id)

    return here.length > 0 ? [{ account, here }] : []
  })

  if (servants.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("services.detail.servants.empty")}</p>
  }

  return (
    <ul className="divide-y border-y">
      {servants.map(({ account, here }) => (
        <li key={account.id} className="flex items-start gap-3 py-3">
          <MemberAvatar
            name={account.displayName}
            initials={initialsOf(account.displayName)}
            seed={account.id}
          />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <bdi className="truncate text-sm font-medium">{account.displayName}</bdi>
            <ul className="flex flex-wrap gap-1.5">
              {here.map((assignment) => (
                <AssignmentChip
                  key={assignment.id}
                  account={account}
                  assignment={assignment}
                  label={assignment.stage?.name ?? t("assignments.wholeService")}
                  removable={canAssign(groupAt(assignment.service, assignment.stage))}
                />
              ))}
            </ul>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function ServiceServants({
  service,
  archived,
}: {
  service: GroupOption
  archived: boolean
}) {
  const t = useTranslations("services.detail.servants")
  const canAssign = useCanAssign()
  const accounts = useQuery(staffAccountsQuery)
  const [assigning, setAssigning] = useState(false)
  const assigns = !archived && canAssign(groupAt(service))
  const active = accounts.data?.items.filter((account) => !account.disabled) ?? []

  return (
    <Section
      id="servants"
      title={t("title")}
      description={t("description")}
      actions={
        assigns && accounts.data ? (
          <Button variant="outline" onClick={() => setAssigning(true)}>
            <Plus data-icon="inline-start" />
            {t("assign")}
          </Button>
        ) : null
      }
    >
      <QueryState query={accounts}>
        {(data) => <ServantRows service={service} accounts={data.items} />}
      </QueryState>
      {assigning ? (
        <AssignServantDialog service={service} accounts={active} onOpenChange={setAssigning} />
      ) : null}
    </Section>
  )
}
