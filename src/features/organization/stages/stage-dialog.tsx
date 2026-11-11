"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ComponentProps, useState } from "react"

import { DialogMount } from "@/components/dialog-mount"
import { NameDescriptionDialog } from "@/components/name-description-dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation"
import type { ServiceReference } from "@/features/organization/services/api"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import {
  addStageRequest,
  type Stage,
  type StageRequest,
  updateStageRequest,
  STAGE_QUERIES,
} from "./api"

export type EditableStage = Pick<Stage, "id" | "name" | "description">

function StageFormDialog(
  props: Omit<ComponentProps<typeof NameDescriptionDialog>, "texts" | "limits" | "problemShown">
) {
  const t = useTranslations("stages.form")

  return (
    <NameDescriptionDialog
      {...props}
      texts={{
        name: t("name"),
        namePlaceholder: t("namePlaceholder"),
        description: t("description"),
        descriptionPlaceholder: t("descriptionPlaceholder"),
      }}
      limits={{ name: 80, description: 500, descriptionRows: 2 }}
      problemShown="inline"
    />
  )
}

function AddStageDialog({ service, onClose }: { service: ServiceReference; onClose: () => void }) {
  const t = useTranslations()
  const router = useRouter()

  const add = useApiMutation((fields: StageRequest) => addStageRequest(service.id, fields), {
    successMessage: (created) => t("toast.added", { name: created.name }),
    invalidate: STAGE_QUERIES,
    toastOnError: false,
    onSuccess: (created) => router.push(routes.stage(created.id)),
  })

  return (
    <StageFormDialog
      title={t("stages.form.addTitle", { service: service.name })}
      description={t("stages.form.addDescription")}
      submitLabel={t("stages.form.add")}
      mutation={add}
      onClose={onClose}
    />
  )
}

export function EditStageDialog({ stage, onClose }: { stage: EditableStage; onClose: () => void }) {
  const t = useTranslations()

  const update = useApiMutation((fields: StageRequest) => updateStageRequest(stage.id, fields), {
    successMessage: t("toast.saved"),
    invalidate: STAGE_QUERIES,
    toastOnError: false,
    onSuccess: onClose,
  })

  return (
    <StageFormDialog
      saved={stage}
      title={t("stages.form.editTitle", { name: stage.name })}
      description={t("stages.form.editDescription")}
      submitLabel={t("common.saveChanges")}
      mutation={update}
      onClose={onClose}
    />
  )
}

export function AddStageButton({
  service,
  label,
  variant = "default",
}: {
  service: ServiceReference
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
        <AddStageDialog service={service} onClose={() => setOpen(false)} />
      </DialogMount>
    </>
  )
}
