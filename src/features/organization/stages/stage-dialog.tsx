"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { DialogMount } from "@/components/dialog-mount"
import { FormDialog } from "@/components/form-dialog"
import { TextAreaField, TextField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { useRouter } from "@/i18n/navigation"
import type { ServiceRef } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import {
  addStageRequest,
  type Stage,
  type StageFields,
  updateStageRequest,
  STAGE_QUERIES,
} from "./api"

export type EditableStage = Pick<Stage, "id" | "name" | "description">

export function StageDialog({
  service,
  stage,
  onClose,
}: {
  service: ServiceRef
  stage?: EditableStage
  onClose: () => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const [name, setName] = useState(stage?.name ?? "")
  const [description, setDescription] = useState(stage?.description ?? "")

  const add = useApiMutation((fields: StageFields) => addStageRequest(service.id, fields), {
    successMessage: (created) => t("toast.added", { name: created.name }),
    invalidate: STAGE_QUERIES,
    toastOnError: false,
    onSuccess: (created) => router.push(routes.stage(created.id)),
  })

  const update = useApiMutation((fields: StageFields) => updateStageRequest(stage!.id, fields), {
    successMessage: t("toast.saved"),
    invalidate: STAGE_QUERIES,
    toastOnError: false,
    onSuccess: onClose,
  })

  const mutation = stage ? update : add
  const errors = mutation.fieldErrors
  const shownInFields = Object.keys(errors).length > 0

  async function submit() {
    const fields = { name, description: description.trim() === "" ? null : description }

    if (!stage) {
      await add.execute(fields)

      return
    }

    const changes: Partial<StageFields> = {}

    if (fields.name !== stage.name) {
      changes.name = fields.name
    }

    if (fields.description !== stage.description) {
      changes.description = fields.description
    }

    if (Object.keys(changes).length === 0) {
      onClose()
    } else {
      await update.execute(fields)
    }
  }

  return (
    <FormDialog
      title={
        stage
          ? t("stages.form.editTitle", { name: stage.name })
          : t("stages.form.addTitle", { service: service.name })
      }
      description={stage ? t("stages.form.editDescription") : t("stages.form.addDescription")}
      pending={mutation.pending}
      problem={mutation.problem}
      submitLabel={stage ? t("common.saveChanges") : t("stages.form.add")}
      onSubmit={submit}
      onClose={onClose}
    >
      {mutation.problem && !shownInFields ? (
        <p role="alert" className="text-sm text-destructive">
          {mutation.problem.message}
        </p>
      ) : null}
      <FieldGroup>
        <TextField
          label={t("stages.form.name")}
          placeholder={t("stages.form.namePlaceholder")}
          autoFocus
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />
        <TextAreaField
          label={t("stages.form.description")}
          placeholder={t("stages.form.descriptionPlaceholder")}
          optional
          dir="auto"
          rows={2}
          maxLength={500}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description}
        />
      </FieldGroup>
    </FormDialog>
  )
}

export function AddStageButton({
  service,
  label,
  variant = "default",
}: {
  service: ServiceRef
  label?: string
  variant?: "default" | "outline"
}) {
  const t = useTranslations("stages.form")
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        {label ?? t("add")}
      </Button>
      <DialogMount open={open}>
        <StageDialog service={service} onClose={() => setOpen(false)} />
      </DialogMount>
    </>
  )
}
