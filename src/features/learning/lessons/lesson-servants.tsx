"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { FormPanel } from "@/components/form-panel"
import { SelectField } from "@/components/form-fields"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { NativeSelectOption } from "@/components/ui/native-select"
import { useSession } from "@/features/identity/auth/session"
import type { Uuid } from "@/lib/api/types/common"

import type { Lesson, LessonOptions } from "./api"

export function useLessonServants(choices: LessonOptions, lesson?: Lesson) {
  const { session } = useSession()
  const viewerId = session.status === "authenticated" ? session.me.account.id : ""
  const listed = choices.servants.some((servant) => servant.id === viewerId)
  const saved = lesson?.responsible
  const savedHelpers = lesson?.collaborators ?? []

  const [responsibleId, setResponsibleId] = useState(
    saved?.id ?? (listed ? viewerId : (choices.servants[0]?.id ?? ""))
  )

  const [helperIds, setHelperIds] = useState(() => savedHelpers.map((helper) => helper.id))

  const responsibles =
    saved && !choices.servants.some((servant) => servant.id === saved.id)
      ? [...choices.servants, saved]
      : choices.servants

  const helpers = [
    ...choices.servants,
    ...savedHelpers.filter((helper) => !choices.servants.some((s) => s.id === helper.id)),
  ].filter((servant) => servant.id !== responsibleId)

  return {
    responsibleId,
    responsibles,
    helperIds,
    helpers,
    chooseResponsible(id: Uuid) {
      setResponsibleId(id)
      setHelperIds((ids) => ids.filter((helper) => helper !== id))
    },
    addHelper: (id: Uuid) => setHelperIds((ids) => [...ids, id]),
    removeHelper: (id: Uuid) => setHelperIds((ids) => ids.filter((helper) => helper !== id)),
  }
}

export function ServantsPanel({
  servants,
  errors,
}: {
  servants: ReturnType<typeof useLessonServants>
  errors: Record<string, string>
}) {
  const t = useTranslations("lessons")
  const helpersError = errors["details.collaboratorIds"]

  return (
    <FormPanel title={t("fields.servants")}>
      <SelectField
        label={t("fields.responsible")}
        value={servants.responsibleId}
        error={errors.responsibleId}
        onChange={(event) => servants.chooseResponsible(event.target.value)}
      >
        {servants.responsibles.map((servant) => (
          <NativeSelectOption key={servant.id} value={servant.id}>
            {servant.name}
          </NativeSelectOption>
        ))}
      </SelectField>
      {servants.helpers.length > 0 ? (
        <FieldSet data-invalid={helpersError ? true : undefined}>
          <FieldLegend variant="label">{t("editor.helping")}</FieldLegend>
          <div className="flex flex-col gap-2">
            {servants.helpers.map((servant) => (
              <Field key={servant.id} orientation="horizontal">
                <Checkbox
                  id={`lesson-helper-${servant.id}`}
                  checked={servants.helperIds.includes(servant.id)}
                  aria-invalid={helpersError ? true : undefined}
                  onCheckedChange={(checked) =>
                    checked === true
                      ? servants.addHelper(servant.id)
                      : servants.removeHelper(servant.id)
                  }
                />
                <FieldLabel htmlFor={`lesson-helper-${servant.id}`} className="font-normal">
                  <bdi>{servant.name}</bdi>
                </FieldLabel>
              </Field>
            ))}
          </div>
          {helpersError ? <FieldError>{helpersError}</FieldError> : null}
        </FieldSet>
      ) : null}
    </FormPanel>
  )
}
