"use client"

import { FormDialog } from "@/components/form-dialog"
import { useCan } from "@/features/identity/auth/session"
import { Archive, ArchiveRestore, Ellipsis, PencilLine, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { TextAreaField, TextField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FieldGroup } from "@/components/ui/field"
import { useRouter } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { groupAt } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import {
  archiveRequest,
  createServiceRequest,
  deleteRequest,
  restoreRequest,
  type ServiceFields,
  type ServiceRow,
  updateServiceRequest,
  useServiceInsight,
  SERVICE_QUERIES,
} from "./api"
import { StructureChangeDialog } from "./structure-change"

function changesOf(service: ServiceRow, fields: ServiceFields): Partial<ServiceFields> {
  const changes: Partial<ServiceFields> = {}

  if (fields.name !== service.name) {
    changes.name = fields.name
  }

  if (fields.description !== service.description) {
    changes.description = fields.description
  }

  return changes
}

export function ServiceDialog({ service, onClose }: { service?: ServiceRow; onClose: () => void }) {
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
    (fields: ServiceFields) => updateServiceRequest(service!.id, fields),
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
      {open ? <ServiceDialog onClose={() => setOpen(false)} /> : null}
    </>
  )
}

export function ServiceActionsMenu({ service }: { service: ServiceRow }) {
  const t = useTranslations()
  const router = useRouter()
  const [open, setOpen] = useState<"edit" | "archive" | "restore" | "delete" | null>(null)
  const can = useCan()
  const edit = can("update", "services", groupAt(service)) && !service.archived
  const archive = can("delete", "services", groupAt(service))

  const impact = useServiceInsight(service.id)?.impact ?? {
    activeSchedules: 0,
    upcomingSessions: 0,
  }

  if (!edit && !archive) {
    return null
  }

  const name = isolate(service.name)
  const close = (next: boolean) => !next && setOpen(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("common.actionsFor", { name: service.name })}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {edit ? (
            <DropdownMenuItem onSelect={() => setOpen("edit")}>
              <PencilLine />
              {t("services.actions.editDetails")}
            </DropdownMenuItem>
          ) : null}
          {archive && !service.archived ? (
            <DropdownMenuItem onSelect={() => setOpen("archive")}>
              <Archive />
              {t("common.archive")}
            </DropdownMenuItem>
          ) : null}
          {archive && service.archived ? (
            <DropdownMenuItem onSelect={() => setOpen("restore")}>
              <ArchiveRestore />
              {t("common.restore")}
            </DropdownMenuItem>
          ) : null}
          {archive ? (
            <DropdownMenuItem variant="destructive" onSelect={() => setOpen("delete")}>
              <Trash2 />
              {t("common.delete")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {edit && open === "edit" ? (
        <ServiceDialog service={service} onClose={() => setOpen(null)} />
      ) : null}
      <StructureChangeDialog
        open={open === "archive"}
        onOpenChange={close}
        title={t("services.archive.title", { name })}
        description={t("services.archive.description")}
        consequences={[
          impact.activeSchedules > 0
            ? t("services.archive.schedules", { count: impact.activeSchedules })
            : t("services.archive.noSchedules"),
          ...(impact.upcomingSessions > 0
            ? [t("services.archive.upcoming", { count: impact.upcomingSessions })]
            : []),
          t("services.archive.kept"),
        ]}
        confirmLabel={t("common.archive")}
        successMessage={t("toast.serviceArchived", { name: service.name })}
        run={() => archiveRequest("services", service.id)}
      />
      <StructureChangeDialog
        open={open === "restore"}
        onOpenChange={close}
        title={t("services.restore.title", { name })}
        description={t("services.restore.description")}
        confirmLabel={t("common.restore")}
        successMessage={t("toast.restored", { name: service.name })}
        run={() => restoreRequest("services", service.id)}
      />
      <StructureChangeDialog
        open={open === "delete"}
        onOpenChange={close}
        tone="destructive"
        title={t("services.delete.title", { name })}
        description={t("services.delete.description")}
        consequences={[
          service.stages.length > 0
            ? t("services.delete.removesStages", { stages: service.stages.length })
            : t("services.delete.removes"),
          t("services.delete.cantUndo"),
        ]}
        confirmLabel={t("common.delete")}
        successMessage={t("toast.deleted", { name: service.name })}
        onSuccess={() => router.push(routes.services())}
        run={() => deleteRequest("services", service.id)}
      />
    </>
  )
}
