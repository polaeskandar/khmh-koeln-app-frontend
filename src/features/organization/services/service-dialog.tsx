"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ComponentProps, useState } from "react"

import { DialogMount } from "@/components/dialog-mount"
import { NameDescriptionDialog } from "@/components/name-description-dialog"
import { Button } from "@/components/ui/button"
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

function ServiceFormDialog(
  props: Omit<ComponentProps<typeof NameDescriptionDialog>, "texts" | "limits" | "problemShown">
) {
  const t = useTranslations("services.form")

  return (
    <NameDescriptionDialog
      {...props}
      texts={{
        name: t("name"),
        namePlaceholder: t("namePlaceholder"),
        description: t("description"),
        descriptionPlaceholder: t("descriptionPlaceholder"),
      }}
      limits={{ name: 120, description: 2000, descriptionRows: 3 }}
      problemShown="toast"
    />
  )
}

function CreateServiceDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations()
  const router = useRouter()

  const create = useApiMutation(createServiceRequest, {
    successMessage: (created) => t("toast.created", { name: created.name }),
    invalidate: SERVICE_QUERIES,
    onSuccess: (created) => router.push(routes.service(created.id)),
  })

  return (
    <ServiceFormDialog
      title={t("services.new")}
      description={t("services.form.newDescription")}
      submitLabel={t("services.form.create")}
      mutation={create}
      onClose={onClose}
    />
  )
}

export function EditServiceDialog({ service, onClose }: { service: Service; onClose: () => void }) {
  const t = useTranslations()

  const update = useApiMutation(
    (fields: ServiceRequest) => updateServiceRequest(service.id, fields),
    { successMessage: t("toast.saved"), invalidate: SERVICE_QUERIES, onSuccess: onClose }
  )

  return (
    <ServiceFormDialog
      saved={service}
      title={t("services.form.editTitle", { name: service.name })}
      description={t("services.form.editDescription")}
      submitLabel={t("common.saveChanges")}
      mutation={update}
      onClose={onClose}
    />
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
        <CreateServiceDialog onClose={() => setOpen(false)} />
      </DialogMount>
    </>
  )
}
