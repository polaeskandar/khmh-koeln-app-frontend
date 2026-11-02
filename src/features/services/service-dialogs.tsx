"use client"

import { Ellipsis, PencilLine, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { focusFirstInvalid } from "@/components/focus-first-invalid"
import { TextAreaField, TextField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import {
  createServiceRequest,
  type ServiceFields,
  type ServiceRow,
  updateServiceRequest,
} from "./api"

const SERVICE_QUERIES = [["services"]]

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

function ServiceForm({ service, onDone }: { service?: ServiceRow; onDone: () => void }) {
  const t = useTranslations()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [name, setName] = useState(service?.name ?? "")
  const [description, setDescription] = useState(service?.description ?? "")

  const create = useApiMutation(createServiceRequest, {
    successMessage: (created) => t("toast.created", { name: created.name }),
    invalidate: SERVICE_QUERIES,
    onSuccess: (created) => router.push(routes.service(created.id)),
  })

  const update = useApiMutation(
    (changes: Partial<ServiceFields>) => updateServiceRequest(service!.id, changes),
    { successMessage: t("toast.saved"), invalidate: SERVICE_QUERIES, onSuccess: onDone }
  )

  const mutation = service ? update : create
  const errors = mutation.fieldErrors

  useEffect(() => {
    if (mutation.problem) {
      focusFirstInvalid(formRef.current)
    }
  }, [mutation.problem])

  async function submit() {
    const fields = { name, description: description.trim() === "" ? null : description }

    if (!service) {
      await create.execute(fields)

      return
    }

    const changes = changesOf(service, fields)

    if (Object.keys(changes).length === 0) {
      onDone()
    } else {
      await update.execute(changes)
    }
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
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
      <DialogFooter>
        <Button type="button" variant="outline" disabled={mutation.pending} onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={mutation.pending}>
          {mutation.pending ? <Spinner data-icon="inline-start" /> : null}
          {service ? t("common.saveChanges") : t("services.form.create")}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ServiceFormDialog({
  service,
  open,
  onOpenChange,
}: {
  service?: ServiceRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("services")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {service ? t("form.editTitle", { name: service.name }) : t("new")}
          </DialogTitle>
          <DialogDescription>
            {service ? t("form.editDescription") : t("form.newDescription")}
          </DialogDescription>
        </DialogHeader>
        {open ? <ServiceForm service={service} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
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
      <ServiceFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function ServiceActionsMenu({ service }: { service: ServiceRow }) {
  const t = useTranslations()
  const [editing, setEditing] = useState(false)

  if (!service.can.edit) {
    return null
  }

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
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <PencilLine />
            {t("services.actions.editDetails")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ServiceFormDialog service={service} open={editing} onOpenChange={setEditing} />
    </>
  )
}
