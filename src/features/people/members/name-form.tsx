"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { TextField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { PERSON_NAME_QUERIES, type PersonNames, type PersonRow, renamePersonRequest } from "./api"

export function NameForm({ person }: { person: PersonRow["person"] }) {
  const t = useTranslations()

  const [edits, setEdits] = useState<Partial<PersonNames>>({})

  const names: PersonNames = {
    firstName: edits.firstName ?? person.firstName,
    lastName: edits.lastName ?? person.lastName,
    displayName: edits.displayName === undefined ? person.displayName : edits.displayName,
  }

  const rename = useApiMutation((next: PersonNames) => renamePersonRequest(person.id, next), {
    successMessage: t("toast.saved"),
    invalidate: PERSON_NAME_QUERIES,
    awaitRefetch: true,
    onSuccess: () => setEdits({}),
  })

  const formRef = useFocusFirstInvalid(rename.problem)
  const next: PersonNames = { ...names, displayName: names.displayName || null }

  const changed =
    next.firstName !== person.firstName ||
    next.lastName !== person.lastName ||
    next.displayName !== person.displayName

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()

        if (changed) {
          void rename.execute(next)
        }
      }}
    >
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("members.fields.firstName")}
            maxLength={80}
            value={names.firstName}
            onChange={(event) => setEdits({ ...edits, firstName: event.target.value })}
            error={rename.fieldErrors.firstName}
          />
          <TextField
            label={t("members.fields.lastName")}
            maxLength={80}
            value={names.lastName}
            onChange={(event) => setEdits({ ...edits, lastName: event.target.value })}
            error={rename.fieldErrors.lastName}
          />
        </div>
        <TextField
          label={t("members.fields.displayName")}
          optional
          maxLength={120}
          description={t("members.fields.displayNameHintShort")}
          value={names.displayName ?? ""}
          onChange={(event) => setEdits({ ...edits, displayName: event.target.value })}
          error={rename.fieldErrors.displayName}
        />
      </FieldGroup>
      {changed ? (
        <Button type="submit" className="self-start" disabled={rename.pending}>
          {rename.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("members.sheet.saveName")}
        </Button>
      ) : null}
    </form>
  )
}
