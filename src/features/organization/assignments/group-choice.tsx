"use client"

import { useQuery } from "@tanstack/react-query"
import { Layers, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { useCanAssign } from "@/features/identity/auth/session"
import { servicesQuery } from "@/features/organization/services/api"
import type { Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { type Group, groupAt } from "@/lib/permissions"

import {
  ASSIGNMENT_QUERIES,
  type Assignment,
  assignRequest,
  type GroupOption,
  removeAssignmentRequest,
  whereOf,
} from "./api"

export const NO_GROUP: Group = { serviceId: "", stageId: null }

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
}: {
  services: GroupOption[]
  value: Group
  onChange: (value: Group) => void
  errors?: Record<string, string | undefined>
  fixedService?: boolean
}) {
  const t = useTranslations("assignments")
  const id = useId()
  const service = services.find((option) => option.id === value.serviceId)

  return (
    <>
      {fixedService ? null : (
        <Field data-invalid={errors.serviceId ? true : undefined}>
          <FieldLabel htmlFor={`${id}-service`}>{t("service")}</FieldLabel>
          <NativeSelect
            id={`${id}-service`}
            className="w-full"
            value={value.serviceId}
            aria-invalid={errors.serviceId ? true : undefined}
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
          </NativeSelect>
          {errors.serviceId ? <FieldError>{errors.serviceId}</FieldError> : null}
        </Field>
      )}
      {service && service.stages.length > 0 ? (
        <Field data-invalid={errors.stageId ? true : undefined}>
          <FieldLabel htmlFor={`${id}-stage`}>{t("stage")}</FieldLabel>
          <NativeSelect
            id={`${id}-stage`}
            className="w-full"
            value={value.stageId ?? ""}
            aria-invalid={errors.stageId ? true : undefined}
            onChange={(event) => onChange({ ...value, stageId: event.target.value || null })}
          >
            <NativeSelectOption value="">{t("wholeService")}</NativeSelectOption>
            {service.stages.map((stage) => (
              <NativeSelectOption key={stage.id} value={stage.id}>
                {stage.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {errors.stageId ? (
            <FieldError>{errors.stageId}</FieldError>
          ) : (
            <FieldDescription>{t("stageHint")}</FieldDescription>
          )}
        </Field>
      ) : null}
    </>
  )
}

export function AssignGroupDialog({
  account,
  services,
  onOpenChange,
}: {
  account: { id: Uuid; displayName: string }
  services: GroupOption[]
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations()
  const [group, setGroup] = useState<Group>(NO_GROUP)

  const assign = useApiMutation((chosen: Group) => assignRequest(account.id, chosen), {
    successMessage: (assignment) =>
      t("toast.groupAssigned", {
        name: isolate(account.displayName),
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
            {t("assignments.dialog.title", { name: isolate(account.displayName) })}
          </DialogTitle>
          <DialogDescription>{t("assignments.dialog.description")}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()

            if (group.serviceId) {
              void assign.execute(group)
            }
          }}
        >
          <FieldGroup>
            <GroupFields
              services={services}
              value={group}
              onChange={setGroup}
              errors={assign.fieldErrors}
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
            <Button type="submit" disabled={!group.serviceId || assign.pending}>
              {assign.pending ? <Spinner data-icon="inline-start" /> : null}
              {t("assignments.assign")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AssignmentChip({
  account,
  assignment,
  label = whereOf(assignment),
  removable,
}: {
  account: { displayName: string }
  assignment: Assignment
  label?: string
  removable: boolean
}) {
  const t = useTranslations()
  const [removing, setRemoving] = useState(false)
  const name = account.displayName
  const where = whereOf(assignment)

  const remove = useApiMutation(() => removeAssignmentRequest(assignment.id), {
    successMessage: t("toast.groupRemoved", { name: isolate(name), where: isolate(where) }),
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
