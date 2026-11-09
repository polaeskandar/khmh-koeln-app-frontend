"use client"

import { useQuery } from "@tanstack/react-query"
import { CircleAlert, UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { focusFirstInvalid } from "@/components/focus-first-invalid"
import { TextField } from "@/components/form-fields"
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { servicesQuery } from "@/features/organization/services/api"
import { useCan } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import type { PersonRef, ServiceRef, StageRef } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { preferredName } from "@/lib/domain/names"

import {
  addMembershipRequest,
  createPersonRequest,
  type NewPerson,
  type PlacementInput,
} from "./api"

type Candidate = PersonRef & { groups: { service: ServiceRef; stage: StageRef | null }[] }

const PEOPLE_QUERIES = [["people"], ["services"]]

const groupAt = (candidate: Candidate, placement: PlacementInput) =>
  candidate.groups.find(
    (group) =>
      group.service.id === placement.serviceId && (group.stage?.id ?? null) === placement.stageId
  )

function AddPersonForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations()
  const f = useFormat()
  const can = useCan()
  const formRef = useRef<HTMLFormElement>(null)
  const services = (useQuery(servicesQuery).data?.items ?? []).filter((s) => !s.archived)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [stageId, setStageId] = useState("")
  const service = services.find((s) => s.id === serviceId) ?? services[0]
  const stages = service?.stages ?? []
  const chosenStage = stages.some((stage) => stage.id === stageId) ? stageId : ""
  const placement = service ? { serviceId: service.id, stageId: chosenStage || null } : null

  const create = useApiMutation(createPersonRequest, {
    toastOnError: false,
    successMessage: (saved) => t("toast.added", { name: preferredName(saved.person) }),
    invalidate: PEOPLE_QUERIES,
    onSuccess: onDone,
  })

  const join = useApiMutation(addMembershipRequest, {
    toastOnError: false,
    invalidate: PEOPLE_QUERIES,
    onSuccess: onDone,
  })

  const busy = create.pending || join.pending

  const problem = create.problem
  const duplicate = problem?.code === "people.duplicate"

  const candidates = duplicate
    ? ((problem.extensions.candidates as Candidate[] | undefined) ?? [])
    : []

  const errors = create.fieldErrors
  const shownInFields = Object.keys(errors).length > 0

  useEffect(() => {
    if (create.problem && Object.keys(create.fieldErrors).length > 0) {
      focusFirstInvalid(formRef.current)
    }
  }, [create.problem, create.fieldErrors])

  const person = (confirmDuplicate?: boolean): NewPerson => ({
    firstName,
    lastName,
    displayName: displayName.trim() === "" ? null : displayName,
    placement,
    ...(confirmDuplicate ? { confirmDuplicate } : {}),
  })

  async function submit(confirmDuplicate?: boolean) {
    if (busy) {
      return
    }

    const result = await create.execute(person(confirmDuplicate))

    if (!result.ok && result.problem.status === 403) {
      toast.error(result.problem.message)
    }
  }

  async function addExisting(candidate: Candidate) {
    if (!placement) {
      return
    }

    const result = await join.execute(candidate.id, placement)

    if (result.ok) {
      toast.success(t("toast.added", { name: preferredName(candidate) }))
    }
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      {duplicate ? (
        <Alert>
          <CircleAlert />
          <AlertDescription className="flex flex-col gap-3">
            <span>{problem.message}</span>
            {candidates.length > 0 ? (
              <ul className="flex flex-col divide-y border-y">
                {candidates.map((candidate) => {
                  const there = placement ? groupAt(candidate, placement) : undefined

                  return (
                    <li key={candidate.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{preferredName(candidate)}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {candidate.groups.length === 0
                            ? t("members.addMember.notInAnyService")
                            : candidate.groups
                                .map((group) =>
                                  group.stage
                                    ? `${group.service.name} · ${group.stage.name}`
                                    : group.service.name
                                )
                                .join(f.separator)}
                        </span>
                      </span>
                      {there ? (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {t("members.newPerson.alreadyIn", {
                            where: isolate(there.stage?.name ?? there.service.name),
                          })}
                        </span>
                      ) : placement && can("update", "members") ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void addExisting(candidate)}
                        >
                          {t("members.addMember.add")}
                        </Button>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            ) : null}
            {join.problem ? (
              <span role="alert" className="text-destructive">
                {join.problem.message}
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="self-start"
              disabled={busy}
              onClick={() => void submit(true)}
            >
              {t("members.newPerson.addAnyway")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : problem && !shownInFields && problem.status !== 403 ? (
        <Alert variant="destructive" role="alert">
          <CircleAlert />
          <AlertDescription>{problem.message}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("members.fields.firstName")}
            autoFocus
            maxLength={80}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            error={errors.firstName}
          />
          <TextField
            label={t("members.fields.lastName")}
            maxLength={80}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            error={errors.lastName}
          />
        </div>
        <TextField
          label={t("members.fields.displayName")}
          optional
          maxLength={120}
          description={t("members.fields.displayNameHint")}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          error={errors.displayName}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors["placement.serviceId"] ? true : undefined}>
            <FieldLabel htmlFor="person-service">{t("members.service")}</FieldLabel>
            <NativeSelect
              id="person-service"
              className="w-full"
              value={service?.id ?? ""}
              aria-invalid={errors["placement.serviceId"] ? true : undefined}
              onChange={(event) => {
                setServiceId(event.target.value)
                setStageId("")
              }}
            >
              {services.map((s) => (
                <NativeSelectOption key={s.id} value={s.id}>
                  {s.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {errors["placement.serviceId"] ? (
              <FieldError>{errors["placement.serviceId"]}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={errors["placement.stageId"] ? true : undefined}>
            <FieldLabel htmlFor="person-stage">{t("members.stage")}</FieldLabel>
            <NativeSelect
              id="person-stage"
              className="w-full"
              value={chosenStage}
              aria-invalid={errors["placement.stageId"] ? true : undefined}
              onChange={(event) => setStageId(event.target.value)}
            >
              <NativeSelectOption value="">{t("members.fields.noStage")}</NativeSelectOption>
              {stages.map((stage) => (
                <NativeSelectOption key={stage.id} value={stage.id}>
                  {stage.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {errors["placement.stageId"] ? (
              <FieldError>{errors["placement.stageId"]}</FieldError>
            ) : null}
          </Field>
        </div>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={busy}>
          {create.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("members.addPerson")}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AddPersonButton() {
  const t = useTranslations("members")
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus data-icon="inline-start" />
        {t("addPerson")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newPerson.title")}</DialogTitle>
            <DialogDescription>{t("newPerson.description")}</DialogDescription>
          </DialogHeader>
          {open ? <AddPersonForm onDone={() => setOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
