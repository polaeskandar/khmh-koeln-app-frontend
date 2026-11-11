"use client"

import { Ellipsis } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useCanIn } from "@/features/identity/auth/session"
import { Link } from "@/i18n/navigation"
import { isolate } from "@/lib/bidi"
import { useRefetch } from "@/lib/api/refetch"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import type { Group } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import {
  deleteHomeworkRequest,
  homeworkFlagsFor,
  HOMEWORK_QUERIES,
  type HomeworkItem,
  type HomeworkTransition,
  transitionHomeworkRequest,
} from "./api"
import { usePublishHomework } from "./use-publish-homework"

type Homework = Pick<HomeworkItem, "id" | "title" | "status" | "publishedAt" | "counts" | "lesson">
type Change = HomeworkTransition | "delete"

function useChangeHomework(homework: Homework, onDeleted?: () => void) {
  const t = useTranslations("homework.toast")
  const shared = useTranslations("toast")
  const title = homework.title

  return useApiMutation(
    async (change: Change) =>
      change === "delete"
        ? (await deleteHomeworkRequest(homework.id), { change, status: null })
        : { change, status: (await transitionHomeworkRequest(homework.id, change)).status },
    {
      successMessage: ({ change, status }) => {
        switch (change) {
          case "unpublish":
            return t("unpublished", { title })
          case "archive":
            return t("archived", { title })
          case "restore":
            return status === "published"
              ? t("restoredPublished", { title })
              : t("restoredDraft", { title })
          case "delete":
            return shared("deletedTitle", { title })
        }
      },
      invalidate: HOMEWORK_QUERIES,
      onSuccess: ({ change }) => {
        if (change === "delete") {
          onDeleted?.()
        }
      },
    }
  )
}

function ChangeDialog({
  homework,
  change,
  onClose,
  onDeleted,
}: {
  homework: Homework
  change: Change
  onClose: () => void
  onDeleted?: () => void
}) {
  const t = useTranslations()
  const mutation = useChangeHomework(homework, onDeleted)
  const refetch = useRefetch()
  const title = isolate(homework.title)
  const reported = homework.counts?.completed ?? 0

  const texts = {
    unpublish: {
      title: t("homework.actions.unpublishTitle", { title }),
      description: t("homework.actions.unpublishText"),
      confirm: t("homework.actions.unpublish"),
    },
    archive: {
      title: t("homework.actions.archiveTitle", { title }),
      description: t("homework.actions.archiveText"),
      confirm: t("common.archive"),
    },
    restore: {
      title: t("homework.actions.restoreTitle", { title }),
      description: homework.publishedAt
        ? t("homework.actions.restorePublished")
        : t("homework.actions.restoreDraft"),
      confirm: t("common.restore"),
    },
    delete: {
      title: t("homework.actions.deleteTitle", { title }),
      description: t("homework.actions.deleteText"),
      confirm: t("homework.actions.deleteDraft"),
    },
  }[change]

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={texts.title}
      description={texts.description}
      note={
        change === "archive" && reported > 0
          ? t("homework.actions.archiveKept", { count: reported })
          : undefined
      }
      confirmLabel={texts.confirm}
      tone={change === "delete" ? "destructive" : "default"}
      onConfirm={async () => {
        const result = await mutation.execute(change)

        if (!result.ok) {
          void refetch(HOMEWORK_QUERIES)
        }

        return result.ok
      }}
    />
  )
}

export function HomeworkActions({
  homework,
  group,
  stageArchived,
  place,
  onDeleted,
}: {
  homework: Homework
  group: Group
  stageArchived: boolean
  place: "list" | "page"
  onDeleted?: () => void
}) {
  const t = useTranslations()
  const publish = usePublishHomework()
  const [change, setChange] = useState<Change | null>(null)
  const can = useCanIn(group)
  const flags = homeworkFlagsFor(can, homework, stageArchived)
  const target = { id: homework.id, title: homework.title, publishedAt: homework.publishedAt }
  const progress = place === "list" && flags.viewProgress && homework.status !== "draft"
  const edit = place === "list" && flags.edit
  const opening = [progress, edit, flags.publish, flags.unpublish].some(Boolean)
  const closing = [flags.archive, flags.restore, flags.delete].some(Boolean)

  return (
    <span className="flex items-center justify-end gap-1">
      {flags.publish ? (
        <Button
          variant="outline"
          size="sm"
          disabled={publish.pending}
          onClick={() => void publish.publish(target)}
        >
          {publish.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("homework.actions.publish")}
        </Button>
      ) : null}
      {opening || closing ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("common.actionsFor", { name: homework.title })}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {progress ? (
              <DropdownMenuItem asChild>
                <Link href={routes.homework(homework.id)}>{t("homework.actions.progress")}</Link>
              </DropdownMenuItem>
            ) : null}
            {edit ? (
              <DropdownMenuItem asChild>
                <Link href={routes.editHomework(homework.id)}>{t("common.edit")}</Link>
              </DropdownMenuItem>
            ) : null}
            {flags.publish ? (
              <DropdownMenuItem
                disabled={publish.pending}
                onSelect={() => void publish.publish(target)}
              >
                {t("homework.actions.publishToParents")}
              </DropdownMenuItem>
            ) : null}
            {flags.unpublish ? (
              <DropdownMenuItem onSelect={() => setChange("unpublish")}>
                {t("homework.actions.unpublish")}
              </DropdownMenuItem>
            ) : null}
            {opening && closing ? <DropdownMenuSeparator /> : null}
            {flags.archive ? (
              <DropdownMenuItem onSelect={() => setChange("archive")}>
                {t("common.archive")}
              </DropdownMenuItem>
            ) : null}
            {flags.restore ? (
              <DropdownMenuItem onSelect={() => setChange("restore")}>
                {t("common.restore")}
              </DropdownMenuItem>
            ) : null}
            {flags.delete ? (
              <DropdownMenuItem variant="destructive" onSelect={() => setChange("delete")}>
                {t("homework.actions.deleteDraft")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      {change ? (
        <ChangeDialog
          homework={homework}
          change={change}
          onClose={() => setChange(null)}
          onDeleted={onDeleted}
        />
      ) : null}
    </span>
  )
}
