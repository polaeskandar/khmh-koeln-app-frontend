"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { SelectField } from "@/components/form-fields"
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
import { FieldGroup } from "@/components/ui/field"
import { NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { initialsOf } from "@/features/identity/auth/role-summary"
import {
  ASSIGNMENT_QUERIES,
  assignRequest,
  type GroupOption,
  whereOf,
} from "@/features/organization/assignments/api"
import { AssignmentChip, GroupFields } from "@/features/organization/assignments/group-choice"
import type { Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import type { Group } from "@/lib/permissions"

import { type ServantAccount, type ServiceServant, serviceServantsQuery } from "./api"

type ServantRow = { account: ServantAccount; assignments: ServiceServant[] }

function rowsByAccount(servants: ServiceServant[]): ServantRow[] {
  const rows = new Map<Uuid, ServantRow>()

  for (const servant of servants) {
    const row = rows.get(servant.account.id) ?? { account: servant.account, assignments: [] }
    rows.set(servant.account.id, { ...row, assignments: [...row.assignments, servant] })
  }

  return [...rows.values()]
}

function AssignServantDialog({
  service,
  accounts,
  onOpenChange,
}: {
  service: GroupOption
  accounts: ServantAccount[]
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations()
  const [accountId, setAccountId] = useState("")
  const [stageId, setStageId] = useState<string | null>(null)
  const account = accounts.find((option) => option.id === accountId)

  const assign = useApiMutation((chosen: string, group: Group) => assignRequest(chosen, group), {
    successMessage: (assignment) =>
      t("toast.groupAssigned", {
        name: isolate(account?.name ?? ""),
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
            <SelectField
              label={t("services.detail.servants.dialog.account")}
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
            >
              <NativeSelectOption value="" disabled>
                {t("services.detail.servants.dialog.chooseAccount")}
              </NativeSelectOption>
              {accounts.map((option) => (
                <NativeSelectOption key={option.id} value={option.id}>
                  {option.name}
                </NativeSelectOption>
              ))}
            </SelectField>
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

function ServantRows({ service, servants }: { service: GroupOption; servants: ServiceServant[] }) {
  const t = useTranslations()

  if (servants.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("services.detail.servants.empty")}</p>
  }

  return (
    <ul className="divide-y border-y">
      {rowsByAccount(servants).map(({ account, assignments }) => (
        <li key={account.id} className="flex items-start gap-3 py-3">
          <MemberAvatar name={account.name} initials={initialsOf(account.name)} seed={account.id} />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <bdi className="truncate text-sm font-medium">{account.name}</bdi>
            <ul className="flex flex-wrap gap-1.5">
              {assignments.map((assignment) => (
                <AssignmentChip
                  key={assignment.assignmentId}
                  account={{ displayName: account.name }}
                  assignment={{ id: assignment.assignmentId, service, stage: assignment.stage }}
                  label={assignment.stage?.name ?? t("assignments.wholeService")}
                  removable
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
  const servants = useQuery(serviceServantsQuery(service.id))
  const [assigning, setAssigning] = useState(false)
  const assignable = archived ? null : servants.data?.assignable

  return (
    <Section
      id="servants"
      title={t("title")}
      description={t("description")}
      actions={
        assignable ? (
          <Button variant="outline" onClick={() => setAssigning(true)}>
            <Plus data-icon="inline-start" />
            {t("assign")}
          </Button>
        ) : null
      }
    >
      <QueryState query={servants}>
        {(data) => <ServantRows service={service} servants={data.servants} />}
      </QueryState>
      {assigning && assignable ? (
        <AssignServantDialog service={service} accounts={assignable} onOpenChange={setAssigning} />
      ) : null}
    </Section>
  )
}
