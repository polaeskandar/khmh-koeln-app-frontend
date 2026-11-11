"use client"

import { CircleAlert, UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { DialogMount } from "@/components/dialog-mount"
import { FormDialog } from "@/components/form-dialog"
import { TextField } from "@/components/form-fields"
import { FormAlert } from "@/components/form-alert"
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
  type DirectoryEntry,
  duplicateCandidatesOf,
  MEMBERSHIP_QUERIES,
  type CreatePerson,
  type PlacementInput,
} from "./api"
import { blocksPlacement } from "./groups"
import { groupsText } from "./person-search"
import { PlacementFields, usePlacement } from "./placement-fields"

const blockingGroupOf = (candidate: DirectoryEntry, placement: PlacementInput) =>
  candidate.groups.find((group) =>
    blocksPlacement({ serviceId: group.service.id, stageId: group.stage?.id ?? null }, placement)
  )

function DuplicateCandidatesAlert({
  message,
  candidates,
  placement,
  busy,
  addError,
  onAdd,
  onAddAnyway,
}: {
  message: string
  candidates: DirectoryEntry[]
  placement: PlacementInput | null
  busy: boolean
  addError: string | undefined
  onAdd: (candidate: DirectoryEntry) => void
  onAddAnyway: () => void
}) {
  const t = useTranslations()
  const f = useFormat()
  const can = useCan()

  return (
    <Alert>
      <CircleAlert />
      <AlertDescription className="flex flex-col gap-3">
        <span>{message}</span>
        {candidates.length > 0 ? (
          <ul className="flex flex-col divide-y border-y">
            {candidates.map((candidate) => {
              const there = placement ? blockingGroupOf(candidate, placement) : undefined

              return (
                <li key={candidate.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{preferredName(candidate)}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {groupsText(candidate, f.separator, t("members.addMember.notInAnyService"))}
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
                      onClick={() => onAdd(candidate)}
                    >
                      {t("members.addMember.add")}
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : null}
        {addError !== undefined ? (
          <span role="alert" className="text-destructive">
            {addError}
          </span>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="self-start"
          disabled={busy}
          onClick={onAddAnyway}
        >
          {t("members.newPerson.addAnyway")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function AddPersonDialog({ preset, onClose }: { preset?: PlacementInput; onClose: () => void }) {
  const t = useTranslations()
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

  const errors = create.fieldErrors
  const shownInFields = Object.keys(errors).length > 0

  const person: CreatePerson = {
    firstName,
    lastName,
    displayName: displayName.trim() === "" ? null : displayName,
    placement,
  }

  async function send(newPerson: CreatePerson) {
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

  async function addExisting(candidate: DirectoryEntry) {
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
        <DuplicateCandidatesAlert
          message={problem.message}
          candidates={duplicateCandidatesOf(problem)}
          placement={placement}
          busy={busy}
          addError={join.problem?.message}
          onAdd={(candidate) => void addExisting(candidate)}
          onAddAnyway={() => void submitAnyway()}
        />
      ) : problem && !shownInFields && problem.status !== 403 ? (
        <FormAlert message={problem.message} />
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
      <DialogMount open={open}>
        <AddPersonDialog preset={placement} onClose={() => setOpen(false)} />
      </DialogMount>
    </>
  )
}
