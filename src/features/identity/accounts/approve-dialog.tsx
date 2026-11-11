"use client"

import { useQuery } from "@tanstack/react-query"
import { Layers, Plus, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { QueryErrorState } from "@/components/page-states"
import { useFormat } from "@/i18n/format"
import { placeLabel } from "@/lib/domain/place"

import { type AccountRequest, STAFF_APPROVAL_QUERIES } from "./api"
import { ApprovalDialog, useApproval } from "./approval-dialog"
import { MemberApproval } from "./member-approval"
import { type DirectoryPerson } from "@/features/people/members/api"
import { parentPortalOnly, rolesQuery } from "@/features/identity/roles/api"
import { PersonSearch } from "@/features/people/members/person-search"
import { RolesChoice } from "@/features/identity/roles/roles-choice"
import type { GroupOption } from "@/features/organization/assignments/api"
import {
  GroupFields,
  NO_GROUP,
  useAssignableGroups,
} from "@/features/organization/assignments/group-choice"
import type { Group } from "@/lib/permissions"

const sameGroup = (a: Group, b: Group) => a.serviceId === b.serviceId && a.stageId === b.stageId

function GroupsChoice({
  services,
  selected,
  onChange,
  errors,
}: {
  services: GroupOption[]
  selected: Group[]
  onChange: (groups: Group[]) => void
  errors: string[]
}) {
  const t = useTranslations("accountRequests.approve")
  const [draft, setDraft] = useState<Group>(NO_GROUP)

  const nameOf = (group: Group) => {
    const service = services.find((option) => option.id === group.serviceId)
    const stage = service?.stages.find((option) => option.id === group.stageId)

    return service ? placeLabel({ service, stage: stage ?? null }) : ""
  }

  function add() {
    if (!selected.some((group) => sameGroup(group, draft))) {
      onChange([...selected, draft])
    }

    setDraft(NO_GROUP)
  }

  return (
    <FieldSet data-invalid={errors.length > 0 ? true : undefined}>
      <FieldLegend variant="label">{t("groups")}</FieldLegend>
      <FieldDescription>{t("groupsHint")}</FieldDescription>
      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((group) => (
            <li
              key={`${group.serviceId}-${group.stageId}`}
              className="inline-flex items-center gap-1 border border-dashed px-2 py-0.5 text-xs"
            >
              <Layers className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
              <bdi>{nameOf(group)}</bdi>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                aria-label={t("removeGroup", { group: nameOf(group) })}
                onClick={() => onChange(selected.filter((other) => !sameGroup(other, group)))}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noGroups")}</p>
      )}
      <div className="flex flex-col gap-3 border p-3">
        <GroupFields services={services} value={draft} onChange={setDraft} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={!draft.serviceId}
          onClick={add}
        >
          <Plus data-icon="inline-start" />
          {t("addGroup")}
        </Button>
      </div>
      {[...new Set(errors)].map((error) => (
        <FieldError key={error}>{error}</FieldError>
      ))}
    </FieldSet>
  )
}

function ChildrenChoice({
  chosen,
  error,
  onChange,
}: {
  chosen: DirectoryPerson[]
  error?: string
  onChange: (children: DirectoryPerson[]) => void
}) {
  const t = useTranslations("accountRequests.approve")

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel>{t("children")}</FieldLabel>
      <PersonSearch chosen={chosen} onChange={onChange} label={t("findChild")} />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

function StaffApproval({ request, onClose }: { request: AccountRequest; onClose: () => void }) {
  const t = useTranslations("accountRequests.approve")
  const f = useFormat()
  const roles = useQuery(rolesQuery)
  const parent = request.registeredAs === "parent"
  const [children, setChildren] = useState<DirectoryPerson[]>([])
  const [ticked, setTicked] = useState<string[] | null>(null)
  const services = useAssignableGroups()
  const approval = useApproval(request, STAFF_APPROVAL_QUERIES, onClose)
  const errors = approval.fieldErrors

  const [groups, setGroups] = useState<Group[]>(() =>
    request.services
      .filter((service) => !service.archived)
      .map((service) => ({ serviceId: service.id, stageId: null }))
  )

  const offered = groups.filter((group) =>
    services.some((service) => service.id === group.serviceId)
  )

  const roleIds =
    ticked ??
    (parent ? (roles.data?.items ?? []).filter(parentPortalOnly).map((role) => role.id) : [])

  const groupErrors = Object.entries(errors).flatMap(([field, error]) =>
    field.startsWith("assignments") && error ? [error] : []
  )

  return (
    <ApprovalDialog
      request={request}
      description={parent ? t("parentDescription") : t("servantDescription")}
      generalError={approval.generalError}
      pending={approval.pending}
      problem={approval.problem}
      submitDisabled={roleIds.length === 0 || (parent && children.length === 0)}
      onSubmit={() =>
        approval.send(
          parent
            ? { as: "parent", childIds: children.map((child) => child.id), roleIds }
            : { as: "servant", roleIds, assignments: offered }
        )
      }
      onClose={onClose}
    >
      {parent ? (
        <ChildrenChoice chosen={children} error={errors.childIds} onChange={setChildren} />
      ) : request.services.length > 0 ? (
        <p className="text-sm">
          {t("servesIn", {
            service: request.services.map((service) => service.name).join(f.separator),
          })}
        </p>
      ) : null}
      {roles.data ? (
        <RolesChoice
          roles={roles.data.items}
          selected={roleIds}
          onChange={setTicked}
          error={errors.roleIds}
        />
      ) : null}
      {!parent && services.length > 0 ? (
        <GroupsChoice
          services={services}
          selected={offered}
          onChange={setGroups}
          errors={groupErrors}
        />
      ) : null}
      {roles.isError ? (
        <QueryErrorState error={roles.error} onRetry={() => roles.refetch()} />
      ) : null}
    </ApprovalDialog>
  )
}

export function ApproveButton({ request }: { request: AccountRequest }) {
  const t = useTranslations("accountRequests")
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>{t("approveButton")}</Button>
      {open && request.registeredAs === "member" ? (
        <MemberApproval request={request} onClose={close} />
      ) : null}
      {open && request.registeredAs !== "member" ? (
        <StaffApproval request={request} onClose={close} />
      ) : null}
    </>
  )
}
