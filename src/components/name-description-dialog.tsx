"use client"

import { type ReactNode, useState } from "react"

import { FormDialog } from "@/components/form-dialog"
import { TextAreaField, TextField } from "@/components/form-fields"
import { FieldGroup } from "@/components/ui/field"

type NameDescription = { name: string; description: string | null }

type NameDescriptionTexts = {
  name: string
  namePlaceholder: string
  description: string
  descriptionPlaceholder: string
}

type NameDescriptionLimits = { name: number; description: number; descriptionRows: number }

type NameDescriptionMutation = {
  pending: boolean
  problem: { message: string } | null
  fieldErrors: Record<string, string>
  execute: (fields: NameDescription) => Promise<unknown>
}

function useNameDescription(saved?: NameDescription) {
  const [name, setName] = useState(saved?.name ?? "")
  const [description, setDescription] = useState(saved?.description ?? "")
  const fields = { name, description: description.trim() === "" ? null : description }

  const unchanged =
    saved !== undefined && fields.name === saved.name && fields.description === saved.description

  return { name, setName, description, setDescription, fields, unchanged }
}

function NameDescriptionFields({
  form,
  texts,
  limits,
  errors,
}: {
  form: ReturnType<typeof useNameDescription>
  texts: NameDescriptionTexts
  limits: NameDescriptionLimits
  errors: Record<string, string>
}) {
  return (
    <FieldGroup>
      <TextField
        label={texts.name}
        placeholder={texts.namePlaceholder}
        autoFocus
        maxLength={limits.name}
        value={form.name}
        onChange={(event) => form.setName(event.target.value)}
        error={errors.name}
      />
      <TextAreaField
        label={texts.description}
        placeholder={texts.descriptionPlaceholder}
        optional
        dir="auto"
        rows={limits.descriptionRows}
        maxLength={limits.description}
        value={form.description}
        onChange={(event) => form.setDescription(event.target.value)}
        error={errors.description}
      />
    </FieldGroup>
  )
}

export function NameDescriptionDialog({
  saved,
  title,
  description,
  submitLabel,
  texts,
  limits,
  mutation,
  problemShown,
  onClose,
}: {
  saved?: NameDescription
  title: ReactNode
  description: ReactNode
  submitLabel: string
  texts: NameDescriptionTexts
  limits: NameDescriptionLimits
  mutation: NameDescriptionMutation
  problemShown: "toast" | "inline"
  onClose: () => void
}) {
  const form = useNameDescription(saved)
  const errors = mutation.fieldErrors
  const inlineProblem = problemShown === "inline" && Object.keys(errors).length === 0

  async function submit() {
    if (form.unchanged) {
      onClose()

      return
    }

    await mutation.execute(form.fields)
  }

  return (
    <FormDialog
      title={title}
      description={description}
      pending={mutation.pending}
      problem={mutation.problem}
      submitLabel={submitLabel}
      onSubmit={submit}
      onClose={onClose}
    >
      {inlineProblem && mutation.problem ? (
        <p role="alert" className="text-sm text-destructive">
          {mutation.problem.message}
        </p>
      ) : null}
      <NameDescriptionFields form={form} texts={texts} limits={limits} errors={errors} />
    </FormDialog>
  )
}
