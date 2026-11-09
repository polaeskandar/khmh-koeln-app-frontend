"use client"

import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Ellipsis,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react"
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
import type { ServiceRef } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { routes } from "@/lib/routes"

import { archiveRequest, deleteRequest, restoreRequest } from "@/features/organization/services/api"
import { StructureChangeDialog } from "@/features/organization/services/structure-change"

import { addStageRequest, type StageFields, updateStageRequest } from "./api"

const STAGE_QUERIES = [["stages"], ["services"]]

export type EditableStage = { id: string; name: string; description: string | null }

function StageForm({
  service,
  stage,
  onDone,
}: {
  service: ServiceRef
  stage?: EditableStage
  onDone: () => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [name, setName] = useState(stage?.name ?? "")
  const [description, setDescription] = useState(stage?.description ?? "")

  const add = useApiMutation((fields: StageFields) => addStageRequest(service.id, fields), {
    successMessage: (created) => t("toast.added", { name: created.name }),
    invalidate: STAGE_QUERIES,
    toastOnError: false,
    onSuccess: (created) => router.push(routes.stage(created.id)),
  })

  const update = useApiMutation(
    (changes: Partial<StageFields>) => updateStageRequest(stage!.id, changes),
    {
      successMessage: t("toast.saved"),
      invalidate: STAGE_QUERIES,
      toastOnError: false,
      onSuccess: onDone,
    }
  )

  const mutation = stage ? update : add
  const errors = mutation.fieldErrors
  const shownInFields = Object.keys(errors).length > 0

  useEffect(() => {
    if (mutation.problem) {
      focusFirstInvalid(formRef.current)
    }
  }, [mutation.problem])

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
      <DialogFooter>
        <Button type="button" variant="outline" disabled={mutation.pending} onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={mutation.pending}>
          {mutation.pending ? <Spinner data-icon="inline-start" /> : null}
          {stage ? t("common.saveChanges") : t("stages.form.add")}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function StageFormDialog({
  service,
  stage,
  open,
  onOpenChange,
}: {
  service: ServiceRef
  stage?: EditableStage
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("stages.form")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {stage
              ? t("editTitle", { name: stage.name })
              : t("addTitle", { service: service.name })}
          </DialogTitle>
          <DialogDescription>
            {stage ? t("editDescription") : t("addDescription")}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <StageForm service={service} stage={stage} onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
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
      <StageFormDialog service={service} open={open} onOpenChange={setOpen} />
    </>
  )
}

type Move = { up: boolean; down: boolean; onMove: (direction: -1 | 1) => void }

export function StageActionsMenu({
  service,
  stage,
  move,
}: {
  service: ServiceRef
  stage: EditableStage & { memberCount?: number }
  move?: Move
}) {
  const t = useTranslations()
  const [open, setOpen] = useState<"edit" | "archive" | "delete" | null>(null)
  const name = isolate(stage.name)
  const close = (next: boolean) => !next && setOpen(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("common.actionsFor", { name: stage.name })}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpen("edit")}>
            <PencilLine />
            {t("stages.actions.rename")}
          </DropdownMenuItem>
          {move ? (
            <>
              <DropdownMenuItem disabled={!move.up} onSelect={() => move.onMove(-1)}>
                <ArrowUp />
                {t("stages.actions.moveUp")}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!move.down} onSelect={() => move.onMove(1)}>
                <ArrowDown />
                {t("stages.actions.moveDown")}
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuItem onSelect={() => setOpen("archive")}>
            <Archive />
            {t("common.archive")}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setOpen("delete")}>
            <Trash2 />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <StageFormDialog
        service={service}
        stage={stage}
        open={open === "edit"}
        onOpenChange={close}
      />
      <StructureChangeDialog
        open={open === "archive"}
        onOpenChange={close}
        title={t("stages.archive.title", { name })}
        description={t("stages.archive.description", { service: isolate(service.name) })}
        consequences={[
          t("stages.archive.schedules"),
          ...(stage.memberCount ? [t("stages.archive.members", { count: stage.memberCount })] : []),
        ]}
        confirmLabel={t("common.archive")}
        successMessage={t("toast.archived", { name: stage.name })}
        run={() => archiveRequest("stages", stage.id)}
      />
      <StructureChangeDialog
        open={open === "delete"}
        onOpenChange={close}
        tone="destructive"
        title={t("stages.delete.title", { name })}
        description={t("stages.delete.description")}
        consequences={[t("stages.delete.schedules"), t("stages.delete.cantUndo")]}
        confirmLabel={t("common.delete")}
        successMessage={t("toast.deleted", { name: stage.name })}
        run={() => deleteRequest("stages", stage.id)}
      />
    </>
  )
}

export function RestoreStageButton({ stage }: { stage: { id: string; name: string } }) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ArchiveRestore data-icon="inline-start" />
        {t("common.restore")}
      </Button>
      <StructureChangeDialog
        open={open}
        onOpenChange={setOpen}
        title={t("stages.restore.title", { name: isolate(stage.name) })}
        description={t("stages.restore.description")}
        confirmLabel={t("common.restore")}
        successMessage={t("toast.restored", { name: stage.name })}
        run={() => restoreRequest("stages", stage.id)}
      />
    </>
  )
}
