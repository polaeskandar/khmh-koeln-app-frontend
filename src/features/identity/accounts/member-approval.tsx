"use client"

import { CircleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ChoiceCards } from "@/components/choice-cards"
import { TextAreaField, TextField } from "@/components/form-fields"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FieldDescription, FieldError, FieldLegend, FieldSet } from "@/components/ui/field"
import { createPersonRequest, MEMBERSHIP_QUERIES } from "@/features/people/members/api"
import { PlacementFields, usePlacement } from "@/features/people/members/placement-fields"
import type { Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { type AccountRequest, type AgeCheck, MEMBER_ACCOUNT_QUERIES } from "./api"
import { ApprovalDialog, useApproval } from "./approval-dialog"
import { MemberRecordChoice, useMemberRecord } from "./member-record-choice"

const NOTE_MAX = 200

const AGE_CHECKS: AgeCheck[] = ["sixteenOrOlder", "guardianConsent"]

function namesOf(displayName: string) {
  const [firstName = "", ...rest] = displayName.trim().split(/\s+/)

  return { firstName, lastName: rest.join(" ") }
}

function useNewRecord(name: string) {
  const [names, setNames] = useState(() => namesOf(name))
  const placement = usePlacement()
  const [createdId, setCreatedId] = useState<Uuid | null>(null)

  const create = useApiMutation(createPersonRequest, {
    toastOnError: false,
    invalidate: MEMBERSHIP_QUERIES,
  })

  async function recordId(duplicate: "refuse" | "confirm") {
    if (createdId) {
      return createdId
    }

    const result = await create.execute({
      ...names,
      displayName: null,
      placement: placement.placement,
      ...(duplicate === "confirm" ? { confirmDuplicate: true } : {}),
    })

    if (!result.ok) {
      return null
    }

    setCreatedId(result.data.person.id)

    return result.data.person.id
  }

  return { names, setNames, placement, createdId, create, recordId }
}

function NewRecordFields({
  record,
  busy,
  ready,
  onAddAnyway,
  onChooseExisting,
}: {
  record: ReturnType<typeof useNewRecord>
  busy: boolean
  ready: boolean
  onAddAnyway: () => void
  onChooseExisting: () => void
}) {
  const t = useTranslations()
  const { create, names, createdId } = record
  const duplicate = create.problem?.code === "people.duplicate"

  const createError =
    create.problem && !duplicate && Object.keys(create.fieldErrors).length === 0
      ? create.problem.message
      : null

  return (
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
              disabled={busy || !ready}
              onClick={onAddAnyway}
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
          value={names.firstName}
          onChange={(event) => record.setNames({ ...names, firstName: event.target.value })}
          error={create.fieldErrors.firstName}
        />
        <TextField
          label={t("members.fields.lastName")}
          maxLength={80}
          disabled={createdId !== null}
          value={names.lastName}
          onChange={(event) => record.setNames({ ...names, lastName: event.target.value })}
          error={create.fieldErrors.lastName}
        />
      </div>
      <PlacementFields choice={record.placement} errors={create.fieldErrors} />
      {createError ? <FieldError>{createError}</FieldError> : null}
      {createdId === null ? (
        <Button
          type="button"
          variant="link"
          className="h-auto self-start p-0"
          disabled={busy}
          onClick={onChooseExisting}
        >
          {t("accountRequests.approve.chooseExisting")}
        </Button>
      ) : null}
    </FieldSet>
  )
}

function AgeCheckField({
  value,
  error,
  onChange,
}: {
  value: AgeCheck | null
  error?: string
  onChange: (value: AgeCheck) => void
}) {
  const t = useTranslations("accountRequests.approve")

  return (
    <FieldSet data-invalid={error ? true : undefined}>
      <FieldLegend variant="label">{t("age")}</FieldLegend>
      <FieldDescription>{t("ageHint")}</FieldDescription>
      <ChoiceCards
        value={value}
        choices={AGE_CHECKS.map((check) => ({ value: check, label: t(`ageCheck.${check}`) }))}
        onChange={onChange}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  )
}

export function MemberApproval({
  request,
  onClose,
}: {
  request: AccountRequest
  onClose: () => void
}) {
  const t = useTranslations()
  const name = request.account.displayName
  const [newRecord, setNewRecord] = useState(false)
  const [ageCheck, setAgeCheck] = useState<AgeCheck | null>(null)
  const [note, setNote] = useState("")
  const existing = useMemberRecord(name)
  const created = useNewRecord(name)
  const approval = useApproval(request, MEMBER_ACCOUNT_QUERIES, onClose)
  const errors = approval.fieldErrors
  const busy = approval.pending || created.create.pending
  const noteTooLong = ageCheck === "guardianConsent" && note.length > NOTE_MAX
  const ready = ageCheck !== null && !noteTooLong

  async function approveWith(duplicate: "refuse" | "confirm") {
    if (busy || !ageCheck || noteTooLong) {
      return
    }

    const personId = newRecord ? await created.recordId(duplicate) : existing.personId

    if (!personId) {
      return
    }

    await approval.send({
      as: "member",
      member: {
        personId,
        ageCheck,
        guardianConsentNote: ageCheck === "guardianConsent" ? note.trim() || null : null,
      },
    })
  }

  return (
    <ApprovalDialog
      request={request}
      description={t("accountRequests.approve.memberDescription")}
      generalError={approval.generalError}
      pending={busy}
      problem={approval.problem ?? created.create.problem}
      submitDisabled={(!newRecord && !existing.personId) || !ready}
      onSubmit={() => approveWith("refuse")}
      onClose={onClose}
    >
      {newRecord ? (
        <NewRecordFields
          record={created}
          busy={busy}
          ready={ready}
          onAddAnyway={() => void approveWith("confirm")}
          onChooseExisting={() => setNewRecord(false)}
        />
      ) : (
        <MemberRecordChoice
          name={name}
          record={existing}
          error={errors["member.personId"]}
          onAddNew={() => setNewRecord(true)}
        />
      )}
      <AgeCheckField value={ageCheck} error={errors["member.ageCheck"]} onChange={setAgeCheck} />
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
    </ApprovalDialog>
  )
}
