"use client"

import { useQuery } from "@tanstack/react-query"
import { Layers, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { FormDialog } from "@/components/form-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { SelectField } from "@/components/form-fields"
import { FieldGroup } from "@/components/ui/field"
import { NativeSelectOption } from "@/components/ui/native-select"
import { useCanAssign } from "@/features/identity/auth/session"
import { servicesQuery } from "@/features/organization/services/api"
import { useFormat } from "@/i18n/format"
import type { Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { type AssignedGroup, type Group, groupAt } from "@/lib/permissions"
import { type Place, placeLabel } from "@/lib/domain/place"

import { ASSIGNMENT_QUERIES, type GroupOption, removeAssignmentRequest } from "./api"
import { useAssignGroup } from "./use-assign-group"

export const NO_GROUP: Group = { serviceId: "", stageId: null }

export const sameGroup = (a: Group, b: Group) =>
  a.serviceId === b.serviceId && a.stageId === b.stageId

export const isCoveredBy = (group: Group, whole: Group) =>
  whole.stageId === null && group.stageId !== null && group.serviceId === whole.serviceId

export function useAssignableGroups(): GroupOption[] {
  const canAssign = useCanAssign()
  const may = canAssign()
  const services = useQuery({ ...servicesQuery, enabled: may })

  return (services.data?.items ?? [])
    .filter((service) => !service.archived && canAssign(groupAt(service)))
    .map((service) => ({
      id: service.id,
      name: service.name,
      stages: [...service.stages]
        .sort((a, b) => a.position - b.position)
        .map((stage) => ({ id: stage.id, name: stage.name })),
    }))
}

export function GroupFields({
  services,
  value,
  onChange,
  errors = {},
  fixedService = false,
  held = [],
}: {
  services: GroupOption[]
  value: Group
  onChange: (value: Group) => void
  errors?: Record<string, string | undefined>
  fixedService?: boolean
  held?: Group[]
}) {
  const t = useTranslations("assignments")
  const f = useFormat()
  const service = services.find((option) => option.id === value.serviceId)
  const holdsWhole = service ? held.some((group) => sameGroup(group, groupAt(service))) : false
  const stages = service && !holdsWhole ? service.stages : []

  const replaced = stages.filter((stage) =>
    held.some((group) => isCoveredBy(group, value) && group.stageId === stage.id)
  )

  return (
    <>
      {fixedService ? null : (
        <SelectField
          label={t("service")}
          value={value.serviceId}
          error={errors.serviceId}
          onChange={(event) => onChange({ serviceId: event.target.value, stageId: null })}
        >
          <NativeSelectOption value="" disabled>
            {t("chooseService")}
          </NativeSelectOption>
          {services.map((option) => (
            <NativeSelectOption key={option.id} value={option.id}>
              {option.name}
            </NativeSelectOption>
          ))}
        </SelectField>
      )}
      {stages.length > 0 ? (
        <SelectField
          label={t("stage")}
          description={
            replaced.length > 0 ? (
              <>
                {t("stageHint")}{" "}
                <span className="block">
                  {t("replaces", {
                    stages: replaced.map((stage) => isolate(stage.name)).join(f.separator),
                  })}
                </span>
              </>
            ) : (
              t("stageHint")
            )
          }
          value={value.stageId ?? ""}
          error={errors.stageId}
          onChange={(event) => onChange({ ...value, stageId: event.target.value || null })}
        >
          <NativeSelectOption value="">{t("wholeService")}</NativeSelectOption>
          {stages.map((stage) => (
            <NativeSelectOption key={stage.id} value={stage.id}>
              {stage.name}
            </NativeSelectOption>
          ))}
        </SelectField>
      ) : null}
    </>
  )
}

export function AssignGroupDialog({
  account,
  services,
  onClose,
}: {
  account: { id: Uuid; displayName: string; assignments: AssignedGroup[] }
  services: GroupOption[]
  onClose: () => void
}) {
  const t = useTranslations()
  const [group, setGroup] = useState<Group>(NO_GROUP)

  const held = account.assignments.map((assignment) =>
    groupAt(assignment.service, assignment.stage)
  )

  const assign = useAssignGroup(account.displayName, onClose)

  return (
    <FormDialog
      title={t("assignments.dialog.title", { name: isolate(account.displayName) })}
      description={t("assignments.dialog.description")}
      pending={assign.pending}
      problem={assign.problem}
      submitLabel={t("assignments.assign")}
      submitDisabled={!group.serviceId}
      onSubmit={() => assign.execute(account.id, group)}
      onClose={onClose}
    >
      <FieldGroup>
        <GroupFields
          services={services}
          value={group}
          onChange={setGroup}
          errors={assign.fieldErrors}
          held={held}
        />
      </FieldGroup>
    </FormDialog>
  )
}

export function AssignmentChip({
  account,
  assignment,
  label = placeLabel(assignment),
  removable,
}: {
  account: { displayName: string }
  assignment: Place & { id: Uuid }
  label?: string
  removable: boolean
}) {
  const t = useTranslations()
  const [removing, setRemoving] = useState(false)
  const name = account.displayName
  const where = placeLabel(assignment)

  const remove = useApiMutation(() => removeAssignmentRequest(assignment.id), {
    successMessage: t("assignments.toast.removed", { name: isolate(name), where: isolate(where) }),
    invalidate: ASSIGNMENT_QUERIES,
  })

  return (
    <li className="inline-flex items-center gap-1 border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
      <Layers className="size-3 shrink-0" aria-hidden="true" />
      <bdi>{label}</bdi>
      {removable ? (
        <>
          <button
            type="button"
            className="hover:text-foreground"
            aria-label={t("assignments.removeLabel", { name, where })}
            onClick={() => setRemoving(true)}
          >
            <X className="size-3" />
          </button>
          <ConfirmDialog
            open={removing}
            onOpenChange={setRemoving}
            title={t("assignments.removeTitle", { name: isolate(name), where: isolate(where) })}
            description={t("assignments.removeDescription")}
            confirmLabel={t("assignments.remove")}
            tone="destructive"
            onConfirm={async () => (await remove.execute()).ok}
          />
        </>
      ) : null}
    </li>
  )
}
