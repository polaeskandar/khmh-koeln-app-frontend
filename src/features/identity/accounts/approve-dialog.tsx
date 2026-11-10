"use client"

import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query"
import { cn } from "cn"
import { CircleAlert, Layers, Plus, Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TextAreaField, TextField } from "@/components/form-fields"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/page-states"
import { useFormat } from "@/i18n/format"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { fold, fullName, preferredName } from "@/lib/domain/names"

import { type AccountRequest, type AgeCheck, approveRequest, memberCandidatesQuery } from "./api"
import { createPersonRequest, type DirectoryPerson } from "@/features/people/members/api"
import { PlacementFields, usePlacement } from "@/features/people/members/placement-fields"
import { parentPortalOnly, rolesQuery } from "@/features/identity/roles/api"
import { groupsText, PersonSearch } from "@/features/people/members/person-search"
import { RolesChoice } from "@/features/identity/roles/roles-choice"
import type { GroupOption } from "@/features/organization/assignments/api"
import {
  GroupFields,
  NO_GROUP,
  useAssignableGroups,
} from "@/features/organization/assignments/group-choice"
import type { Group } from "@/lib/permissions"

const CLOSE_AND_REFETCH = new Set(["accounts.alreadyApproved", "notFound.user"])

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

    return stage ? `${service?.name} · ${stage.name}` : (service?.name ?? "")
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

function Approval({ request, onDone }: { request: AccountRequest; onDone: () => void }) {
  const t = useTranslations()
  const f = useFormat()
  const queryClient = useQueryClient()
  const roles = useQuery(rolesQuery)
  const parent = request.registeredAs === "parent"
  const [children, setChildren] = useState<DirectoryPerson[]>([])
  const [ticked, setTicked] = useState<string[] | null>(null)
  const services = useAssignableGroups()

  const [groups, setGroups] = useState<Group[]>(() =>
    request.services
      .filter((service) => !service.archived)
      .map((service) => ({ serviceId: service.id, stageId: null }))
  )

  const offered = groups.filter((group) =>
    services.some((service) => service.id === group.serviceId)
  )

  const approve = useApiMutation(approveRequest, {
    successMessage: t("toast.accountApproved", { name: request.account.displayName }),
    invalidate: [["accountRequests"], ["staff-accounts"], ["roles"], ["guardian-links"]],
    toastOnError: false,
    onSuccess: onDone,
  })

  const roleIds =
    ticked ??
    (parent ? (roles.data?.items ?? []).filter(parentPortalOnly).map((role) => role.id) : [])

  async function submit() {
    const result = await approve.execute(
      request.account.id,
      parent
        ? { as: "parent", childIds: children.map((child) => child.id), roleIds }
        : { as: "servant", roleIds, assignments: offered }
    )

    if (!result.ok && result.problem.code && CLOSE_AND_REFETCH.has(result.problem.code)) {
      toast.error(result.problem.message)
      void queryClient.invalidateQueries({ queryKey: ["accountRequests"] })
      onDone()
    }
  }

  const errors = approve.fieldErrors

  const groupErrors = Object.entries(errors).flatMap(([field, error]) =>
    field.startsWith("assignments") && error ? [error] : []
  )

  const generalError =
    approve.problem &&
    Object.keys(errors).length === 0 &&
    !CLOSE_AND_REFETCH.has(approve.problem.code ?? "")
      ? approve.problem.message
      : null

  return (
    <>
      {request.note ? (
        <blockquote dir="auto" className="border-s-2 ps-3 text-sm text-muted-foreground">
          {request.note}
        </blockquote>
      ) : null}
      {parent ? (
        <Field data-invalid={errors.childIds ? true : undefined}>
          <FieldLabel>{t("accountRequests.approve.children")}</FieldLabel>
          <PersonSearch
            chosen={children}
            onChange={setChildren}
            label={t("accountRequests.approve.findChild")}
          />
          {errors.childIds ? <FieldError>{errors.childIds}</FieldError> : null}
        </Field>
      ) : request.services.length > 0 ? (
        <p className="text-sm">
          {t("accountRequests.approve.servesIn", {
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
      {generalError ? <FieldError>{generalError}</FieldError> : null}
      {roles.isError ? (
        <QueryErrorState error={roles.error} onRetry={() => roles.refetch()} />
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={approve.pending} onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          disabled={approve.pending || roleIds.length === 0 || (parent && children.length === 0)}
          onClick={() => void submit()}
        >
          {approve.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("accountRequests.approve.submit")}
        </Button>
      </DialogFooter>
    </>
  )
}

const NOTE_MAX = 200

function namesOf(displayName: string) {
  const [firstName = "", ...rest] = displayName.trim().split(/\s+/)

  return { firstName, lastName: rest.join(" ") }
}

function MemberApproval({ request, onDone }: { request: AccountRequest; onDone: () => void }) {
  const t = useTranslations()
  const f = useFormat()
  const queryClient = useQueryClient()
  const id = useId()
  const name = request.account.displayName
  const [text, setText] = useState(name)
  const q = useDebounced(text.trim(), 250)
  const candidates = useQuery({ ...memberCandidatesQuery(q), enabled: q.length >= 2 })
  const [picked, setPicked] = useState<string | null | undefined>(undefined)
  const [ageCheck, setAgeCheck] = useState<AgeCheck | null>(null)
  const [note, setNote] = useState("")
  const [newRecord, setNewRecord] = useState(false)
  const [firstName, setFirstName] = useState(() => namesOf(name).firstName)
  const [lastName, setLastName] = useState(() => namesOf(name).lastName)
  const placementChoice = usePlacement()
  const [createdId, setCreatedId] = useState<string | null>(null)

  const create = useApiMutation(createPersonRequest, {
    toastOnError: false,
    invalidate: [["people"], ["services"], ["stages"]],
  })

  const approve = useApiMutation(approveRequest, {
    successMessage: t("toast.accountApproved", { name }),
    invalidate: [["accountRequests"], ["member-accounts"]],
    toastOnError: false,
    onSuccess: onDone,
  })

  const items = candidates.data?.items ?? []
  const namesakes = items.filter((person) => fold(fullName(person)) === fold(name))
  const free = namesakes.filter((person) => !person.hasAccount)
  const shown = items.some((person) => person.id === picked)

  const personId =
    picked === undefined ? (free.length === 1 ? free[0]!.id : null) : shown ? picked : null

  const noteTooLong = ageCheck === "guardianConsent" && note.length > NOTE_MAX
  const errors = approve.fieldErrors
  const busy = approve.pending || create.pending
  const duplicate = create.problem?.code === "people.duplicate"

  const createError =
    create.problem && !duplicate && Object.keys(create.fieldErrors).length === 0
      ? create.problem.message
      : null

  const generalError =
    approve.problem &&
    Object.keys(errors).length === 0 &&
    !CLOSE_AND_REFETCH.has(approve.problem.code ?? "")
      ? approve.problem.message
      : null

  async function recordId(confirmDuplicate?: boolean) {
    if (!newRecord) {
      return personId
    }

    if (createdId) {
      return createdId
    }

    const result = await create.execute({
      firstName,
      lastName,
      displayName: null,
      placement: placementChoice.placement,
      ...(confirmDuplicate ? { confirmDuplicate } : {}),
    })

    if (!result.ok) {
      return null
    }

    setCreatedId(result.data.person.id)

    return result.data.person.id
  }

  async function submit(confirmDuplicate?: boolean) {
    if (busy || !ageCheck || noteTooLong) {
      return
    }

    const chosen = await recordId(confirmDuplicate)

    if (!chosen) {
      return
    }

    const result = await approve.execute(request.account.id, {
      as: "member",
      member: {
        personId: chosen,
        ageCheck,
        guardianConsentNote: ageCheck === "guardianConsent" ? note.trim() || null : null,
      },
    })

    if (!result.ok && result.problem.code && CLOSE_AND_REFETCH.has(result.problem.code)) {
      toast.error(result.problem.message)
      void queryClient.invalidateQueries({ queryKey: ["accountRequests"] })
      onDone()
    }
  }

  return (
    <>
      {request.note ? (
        <blockquote dir="auto" className="border-s-2 ps-3 text-sm text-muted-foreground">
          {request.note}
        </blockquote>
      ) : null}
      {newRecord ? (
        <FieldSet>
          <FieldLegend variant="label">{t("accountRequests.approve.newRecord")}</FieldLegend>
          <FieldDescription>{t("accountRequests.approve.newRecordHint")}</FieldDescription>
          {duplicate ? (
            <Alert>
              <CircleAlert />
              <AlertDescription className="flex flex-col gap-3">
                <span>{create.problem?.message}</span>
                <Button
                  type="button"
                  variant="outline"
                  className="self-start"
                  disabled={busy || !ageCheck || noteTooLong}
                  onClick={() => void submit(true)}
                >
                  {t("members.newPerson.addAnyway")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={t("members.fields.firstName")}
              maxLength={80}
              disabled={createdId !== null}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              error={create.fieldErrors.firstName}
            />
            <TextField
              label={t("members.fields.lastName")}
              maxLength={80}
              disabled={createdId !== null}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              error={create.fieldErrors.lastName}
            />
          </div>
          <PlacementFields choice={placementChoice} errors={create.fieldErrors} />
          {createError ? <FieldError>{createError}</FieldError> : null}
          {createdId === null ? (
            <Button
              type="button"
              variant="link"
              className="h-auto self-start p-0"
              disabled={busy}
              onClick={() => setNewRecord(false)}
            >
              {t("accountRequests.approve.chooseExisting")}
            </Button>
          ) : null}
        </FieldSet>
      ) : (
        <FieldSet data-invalid={errors["member.personId"] ? true : undefined}>
          <FieldLegend variant="label">{t("accountRequests.approve.memberRecord")}</FieldLegend>
          <FieldDescription>
            {t("accountRequests.approve.memberRecordHint", { name: isolate(name) })}
          </FieldDescription>
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t("accountRequests.approve.findMember")}
              placeholder={t("accountRequests.approve.findMember")}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </InputGroup>
          {namesakes.length > 1 ? (
            <p role="status" className="text-sm text-warning">
              {t("accountRequests.approve.sameName", {
                count: namesakes.length,
                name: isolate(name),
              })}
            </p>
          ) : null}
          {q.length < 2 ? (
            <p className="text-xs text-muted-foreground">
              {t("accountRequests.approve.searchMember")}
            </p>
          ) : candidates.isError ? (
            <QueryErrorState error={candidates.error} onRetry={() => candidates.refetch()} />
          ) : candidates.data && items.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("accountRequests.approve.noMemberMatches")}
            </p>
          ) : (
            <RadioGroup
              value={personId ?? ""}
              onValueChange={(value) => setPicked(value)}
              className="flex flex-col gap-0 divide-y border-y"
            >
              {items.map((person) => (
                <label
                  key={person.id}
                  htmlFor={`${id}-${person.id}`}
                  className={cn(
                    "flex items-start gap-3 py-2.5 text-sm",
                    person.hasAccount ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  )}
                >
                  <RadioGroupItem
                    id={`${id}-${person.id}`}
                    value={person.id}
                    disabled={person.hasAccount}
                    className="mt-0.5"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-medium">
                      <bdi>{preferredName(person)}</bdi>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {person.hasAccount
                        ? t("accountRequests.approve.hasAccount")
                        : groupsText(person, f.separator, t("accountRequests.approve.noGroup"))}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
          <Button
            type="button"
            variant="link"
            className="h-auto self-start p-0"
            onClick={() => setNewRecord(true)}
          >
            {t("accountRequests.approve.addNew", { name: isolate(name) })}
          </Button>
          {errors["member.personId"] ? <FieldError>{errors["member.personId"]}</FieldError> : null}
        </FieldSet>
      )}
      <FieldSet data-invalid={errors["member.ageCheck"] ? true : undefined}>
        <FieldLegend variant="label">{t("accountRequests.approve.age")}</FieldLegend>
        <FieldDescription>{t("accountRequests.approve.ageHint")}</FieldDescription>
        <RadioGroup
          value={ageCheck ?? ""}
          onValueChange={(value) => setAgeCheck(value as AgeCheck)}
          className="flex flex-col gap-2"
        >
          {(["sixteenOrOlder", "guardianConsent"] as const).map((value) => (
            <label
              key={value}
              htmlFor={`${id}-${value}`}
              className="flex w-full cursor-pointer items-center gap-3 border p-3 text-sm"
            >
              <RadioGroupItem id={`${id}-${value}`} value={value} />
              {t(`accountRequests.approve.ageCheck.${value}`)}
            </label>
          ))}
        </RadioGroup>
        {errors["member.ageCheck"] ? <FieldError>{errors["member.ageCheck"]}</FieldError> : null}
      </FieldSet>
      {ageCheck === "guardianConsent" ? (
        <TextAreaField
          label={t("accountRequests.approve.consentNote")}
          dir="auto"
          value={note}
          placeholder={t("accountRequests.approve.consentNotePlaceholder")}
          onChange={(event) => setNote(event.target.value)}
          error={
            noteTooLong
              ? t("errors.validation.tooLong", { max: String(NOTE_MAX) })
              : errors["member.guardianConsentNote"]
          }
        />
      ) : null}
      {generalError ? <FieldError>{generalError}</FieldError> : null}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          disabled={busy || (!newRecord && !personId) || !ageCheck || noteTooLong}
          onClick={() => void submit()}
        >
          {approve.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("accountRequests.approve.submit")}
        </Button>
      </DialogFooter>
    </>
  )
}

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms)

    return () => clearTimeout(timer)
  }, [value, ms])

  return debounced
}

export function ApproveButton({ request }: { request: AccountRequest }) {
  const t = useTranslations("accountRequests")
  const [open, setOpen] = useState(false)
  const busy = useIsMutating() > 0

  return (
    <>
      <Button onClick={() => setOpen(true)}>{t("approveButton")}</Button>
      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("approve.title", { name: request.account.displayName })}</DialogTitle>
            <DialogDescription>
              {request.registeredAs === "member"
                ? t("approve.memberDescription")
                : request.registeredAs === "parent"
                  ? t("approve.parentDescription")
                  : t("approve.servantDescription")}
            </DialogDescription>
          </DialogHeader>
          {open ? (
            <div className="flex flex-col gap-4">
              {request.registeredAs === "member" ? (
                <MemberApproval request={request} onDone={() => setOpen(false)} />
              ) : (
                <Approval request={request} onDone={() => setOpen(false)} />
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
