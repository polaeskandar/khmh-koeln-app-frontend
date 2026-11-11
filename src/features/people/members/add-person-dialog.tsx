"use client"

import { CircleAlert, UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { FormDialog } from "@/components/form-dialog"
import { TextField } from "@/components/form-fields"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { useCan } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { preferredName } from "@/lib/domain/names"

import {
  addMembershipRequest,
  createPersonRequest,
  type DirectoryPerson,
  duplicateCandidatesOf,
  MEMBERSHIP_QUERIES,
  type NewPerson,
  type PlacementInput,
} from "./api"
import { blocksPlacement } from "./groups"
import { PlacementFields, usePlacement } from "./placement-fields"

const blockingGroupOf = (candidate: DirectoryPerson, placement: PlacementInput) =>
  candidate.groups.find((group) =>
    blocksPlacement({ serviceId: group.service.id, stageId: group.stage?.id ?? null }, placement)
  )

function AddPersonDialog({ preset, onClose }: { preset?: PlacementInput; onClose: () => void }) {
  const t = useTranslations()
  const f = useFormat()
  const can = useCan()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const placementChoice = usePlacement(preset)
  const placement = placementChoice.placement

  const create = useApiMutation(createPersonRequest, {
    toastOnError: false,
    successMessage: (saved) => t("toast.added", { name: preferredName(saved.person) }),
    invalidate: MEMBERSHIP_QUERIES,
    onSuccess: onClose,
  })

  const join = useApiMutation(addMembershipRequest, {
    toastOnError: false,
    invalidate: MEMBERSHIP_QUERIES,
    onSuccess: onClose,
  })

  const busy = create.pending || join.pending

  const problem = create.problem
  const duplicate = problem?.code === "people.duplicate"

  const candidates = duplicateCandidatesOf(problem)

  const errors = create.fieldErrors
  const shownInFields = Object.keys(errors).length > 0

  const person: NewPerson = {
    firstName,
    lastName,
    displayName: displayName.trim() === "" ? null : displayName,
    placement,
  }

  async function send(newPerson: NewPerson) {
    if (busy) {
      return
    }

    const result = await create.execute(newPerson)

    if (!result.ok && result.problem.status === 403) {
      toast.error(result.problem.message)
    }
  }

  const submit = () => send(person)

  const submitAnyway = () => send({ ...person, confirmDuplicate: true })

  async function addExisting(candidate: DirectoryPerson) {
    if (!placement) {
      return
    }

    const result = await join.execute(candidate.id, placement)

    if (result.ok) {
      toast.success(t("toast.added", { name: preferredName(candidate) }))
    }
  }

  return (
    <FormDialog
      title={t("members.newPerson.title")}
      description={t("members.newPerson.description")}
      pending={busy}
      problem={create.problem}
      submitLabel={t("members.addPerson")}
      onSubmit={submit}
      onClose={onClose}
    >
      {duplicate ? (
        <Alert>
          <CircleAlert />
          <AlertDescription className="flex flex-col gap-3">
            <span>{problem.message}</span>
            {candidates.length > 0 ? (
              <ul className="flex flex-col divide-y border-y">
                {candidates.map((candidate) => {
                  const there = placement ? blockingGroupOf(candidate, placement) : undefined

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
                      ) : placement && can("update", "members", placement) ? (
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
              onClick={() => void submitAnyway()}
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
        <PlacementFields choice={placementChoice} errors={errors} />
      </FieldGroup>
    </FormDialog>
  )
}

export function AddPersonButton({ placement }: { placement?: PlacementInput }) {
  const t = useTranslations("members")
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus data-icon="inline-start" />
        {t("addPerson")}
      </Button>
      {open ? <AddPersonDialog preset={placement} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
