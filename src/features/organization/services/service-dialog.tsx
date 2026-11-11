"use client"

import { DialogMount } from "@/components/dialog-mount"
import { FormDialog } from "@/components/form-dialog"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { TextAreaField, TextField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { useRouter } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import {
  createServiceRequest,
  type ServiceRequest,
  type Service,
  updateServiceRequest,
  SERVICE_QUERIES,
} from "./api"

function changesOf(service: Service, fields: ServiceRequest): Partial<ServiceRequest> {
  const changes: Partial<ServiceRequest> = {}

  if (fields.name !== service.name) {
    changes.name = fields.name
  }

  if (fields.description !== service.description) {
    changes.description = fields.description
  }

  return changes
}

export function ServiceDialog({ service, onClose }: { service?: Service; onClose: () => void }) {
  const t = useTranslations()
  const router = useRouter()
  const [name, setName] = useState(service?.name ?? "")
  const [description, setDescription] = useState(service?.description ?? "")

  const create = useApiMutation(createServiceRequest, {
    successMessage: (created) => t("toast.created", { name: created.name }),
    invalidate: SERVICE_QUERIES,
    onSuccess: (created) => router.push(routes.service(created.id)),
  })

  const update = useApiMutation(
    (fields: ServiceRequest) => updateServiceRequest(service!.id, fields),
    { successMessage: t("toast.saved"), invalidate: SERVICE_QUERIES, onSuccess: onClose }
  )

  const mutation = service ? update : create
  const errors = mutation.fieldErrors

  async function submit() {
    const fields = { name, description: description.trim() === "" ? null : description }

    if (!service) {
      await create.execute(fields)

      return
    }

    const changes = changesOf(service, fields)

    if (Object.keys(changes).length === 0) {
      onClose()
    } else {
      await update.execute(fields)
    }
  }

  return (
    <FormDialog
      title={service ? t("services.form.editTitle", { name: service.name }) : t("services.new")}
      description={service ? t("services.form.editDescription") : t("services.form.newDescription")}
      pending={mutation.pending}
      problem={mutation.problem}
      submitLabel={service ? t("common.saveChanges") : t("services.form.create")}
      onSubmit={submit}
      onClose={onClose}
    >
      <FieldGroup>
        <TextField
          label={t("services.form.name")}
          placeholder={t("services.form.namePlaceholder")}
          autoFocus
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />
        <TextAreaField
          label={t("services.form.description")}
          placeholder={t("services.form.descriptionPlaceholder")}
          optional
          dir="auto"
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description}
        />
      </FieldGroup>
    </FormDialog>
  )
}

export function NewServiceButton() {
  const t = useTranslations("services")
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        {t("new")}
      </Button>
      <DialogMount open={open}>
        <ServiceDialog onClose={() => setOpen(false)} />
      </DialogMount>
    </>
  )
}
