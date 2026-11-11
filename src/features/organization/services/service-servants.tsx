"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { DialogMount } from "@/components/dialog-mount"
import { FormDialog } from "@/components/form-dialog"
import { SelectField } from "@/components/form-fields"
import { MemberAvatar } from "@/components/member-avatar"
import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { NativeSelectOption } from "@/components/ui/native-select"
import { initialsOf } from "@/lib/domain/names"
import { type GroupOption } from "@/features/organization/assignments/api"
import { AssignmentChip, GroupFields } from "@/features/organization/assignments/group-choice"
import { useAssignGroup } from "@/features/organization/assignments/use-assign-group"
import type { Uuid } from "@/lib/api/types/common"
import { isolate } from "@/lib/bidi"
import { groupAt } from "@/lib/permissions"

import { type AccountReference, type ServiceServant, serviceServantsQuery } from "./api"

type ServantRow = { account: AccountReference; assignments: ServiceServant[] }

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
  servants,
  onClose,
}: {
  service: GroupOption
  accounts: AccountReference[]
  servants: ServiceServant[]
  onClose: () => void
}) {
  const t = useTranslations()
  const [accountId, setAccountId] = useState("")
  const [stageId, setStageId] = useState<string | null>(null)
  const account = accounts.find((option) => option.id === accountId)
  const assign = useAssignGroup(account?.name ?? "", onClose)

  const held = servants
    .filter((servant) => servant.account.id === accountId)
    .map((servant) => groupAt(service, servant.stage))

  const holdsWhole = held.some((other) => other.stageId === null)
  const group = { serviceId: service.id, stageId: holdsWhole ? null : stageId }

  return (
    <FormDialog
      title={t("services.detail.servants.dialog.title", { service: isolate(service.name) })}
      description={t("assignments.dialog.description")}
      pending={assign.pending}
      problem={assign.problem}
      submitLabel={t("assignments.assign")}
      submitDisabled={!accountId}
      onSubmit={() => assign.execute(accountId, group)}
      onClose={onClose}
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
          value={group}
          onChange={(chosen) => setStageId(chosen.stageId)}
          errors={assign.fieldErrors}
          held={held}
          fixedService
        />
      </FieldGroup>
    </FormDialog>
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
      <DialogMount open={assigning && Boolean(assignable)}>
        {assignable ? (
          <AssignServantDialog
            service={service}
            accounts={assignable}
            servants={servants.data?.servants ?? []}
            onClose={() => setAssigning(false)}
          />
        ) : null}
      </DialogMount>
    </Section>
  )
}
