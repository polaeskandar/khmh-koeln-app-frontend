"use client"

import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Ellipsis,
  PencilLine,
  Trash2,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { DialogMount } from "@/components/dialog-mount"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCan } from "@/features/identity/auth/session"
import type { ServiceReference } from "@/features/organization/services/api"
import { isolate } from "@/lib/bidi"
import { groupAt } from "@/lib/permissions"
import { StructureChangeDialog } from "@/features/organization/services/structure-change"

import { archiveStageRequest, deleteStageRequest, restoreStageRequest } from "./api"
import { EditStageDialog, type EditableStage } from "./stage-dialog"

type Move = { up: boolean; down: boolean; onMove: (direction: -1 | 1) => void }

export function StageActionsMenu({
  service,
  stage,
  move,
}: {
  service: ServiceReference
  stage: EditableStage & { memberCount?: number }
  move?: Move
}) {
  const t = useTranslations()
  const can = useCan()
  const [open, setOpen] = useState<"edit" | "archive" | "delete" | null>(null)
  const name = isolate(stage.name)
  const remove = can("delete", "stages", groupAt(service))
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
          {remove ? (
            <DropdownMenuItem variant="destructive" onSelect={() => setOpen("delete")}>
              <Trash2 />
              {t("common.delete")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogMount open={open === "edit"}>
        <EditStageDialog stage={stage} onClose={() => setOpen(null)} />
      </DialogMount>
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
        request={() => archiveStageRequest(stage.id)}
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
        request={() => deleteStageRequest(stage.id)}
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
        request={() => restoreStageRequest(stage.id)}
      />
    </>
  )
}
