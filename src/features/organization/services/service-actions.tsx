"use client"

import { Archive, ArchiveRestore, Ellipsis, PencilLine, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { useCan } from "@/features/identity/auth/session"
import { DialogMount } from "@/components/dialog-mount"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "@/i18n/navigation"
import { isolate } from "@/lib/bidi"
import { groupAt } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import {
  archiveServiceRequest,
  deleteServiceRequest,
  restoreServiceRequest,
  type Service,
  useServiceInsight,
} from "./api"
import { StructureChangeDialog } from "./structure-change"
import { EditServiceDialog } from "./service-dialog"

export function ServiceActionsMenu({ service }: { service: Service }) {
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
      <DialogMount open={edit && open === "edit"}>
        <EditServiceDialog service={service} onClose={() => setOpen(null)} />
      </DialogMount>
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
        successMessage={t("services.toast.archived", { name: service.name })}
        request={() => archiveServiceRequest(service.id)}
      />
      <StructureChangeDialog
        open={open === "restore"}
        onOpenChange={close}
        title={t("services.restore.title", { name })}
        description={t("services.restore.description")}
        confirmLabel={t("common.restore")}
        successMessage={t("toast.restored", { name: service.name })}
        request={() => restoreServiceRequest(service.id)}
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
        request={() => deleteServiceRequest(service.id)}
      />
    </>
  )
}
