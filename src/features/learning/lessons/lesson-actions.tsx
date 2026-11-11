"use client"

import { useQuery } from "@tanstack/react-query"
import { Ellipsis, PencilLine } from "lucide-react"
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
import { useCanIn } from "@/features/identity/auth/session"
import { stageHomeworkQuery } from "@/features/learning/homework/api"
import { Link, useRouter } from "@/i18n/navigation"
import { useRefetch } from "@/lib/api/refetch"
import type { LessonStatus } from "@/lib/api/types/learning"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { groupAt } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import {
  archiveLessonRequest,
  changeLessonStatusRequest,
  deleteLessonRequest,
  LESSON_ARCHIVE_QUERIES,
  LESSON_QUERIES,
  type LessonDetail,
  type LessonFlags,
  lessonFlagsFor,
  restoreLessonRequest,
} from "./api"

const STATUS_TOAST: Record<
  LessonStatus,
  "toast.lessonBackToDraft" | "toast.lessonMarkedReady" | "toast.lessonTaught"
> = {
  draft: "toast.lessonBackToDraft",
  ready: "toast.lessonMarkedReady",
  completed: "toast.lessonTaught",
}

function useLessonChange<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  successMessage: string,
  onSuccess?: () => void
) {
  const refetch = useRefetch()

  const mutation = useApiMutation(fn, {
    successMessage,
    invalidate: LESSON_ARCHIVE_QUERIES,
    onSuccess,
  })

  return {
    pending: mutation.pending,
    execute: async (...args: A) => {
      const result = await mutation.execute(...args)

      if (!result.ok) {
        void refetch(LESSON_QUERIES)
      }

      return result.ok
    },
  }
}

function useEverPublished({
  archived,
  lesson,
  service,
  stage,
  homework,
}: LessonDetail): boolean | null {
  const can = useCanIn(groupAt(service, stage))
  const readable = can("read", "homework")

  const deletable =
    lesson.status === "draft" && lesson.archivedAt === null && !archived && can("update", "lessons")

  const tasks = useQuery({ ...stageHomeworkQuery(stage.id), enabled: readable && deletable })

  if (!readable) {
    return homework.published > 0
  }

  return tasks.data
    ? tasks.data.items.some((task) => task.lesson.id === lesson.id && task.publishedAt !== null)
    : null
}

export function useLessonFlags(data: LessonDetail): LessonFlags {
  const can = useCanIn(groupAt(data.service, data.stage))
  const everPublished = useEverPublished(data)

  return lessonFlagsFor(can, data, everPublished)
}

export function LessonActions({ data, flags }: { data: LessonDetail; flags: LessonFlags }) {
  const t = useTranslations()
  const router = useRouter()
  const { lesson, stage, homework } = data
  const [dialog, setDialog] = useState<"archive" | "delete" | null>(null)
  const title = isolate(lesson.title)

  const change = useApiMutation(changeLessonStatusRequest, {
    successMessage: (saved) => t(STATUS_TOAST[saved.status]),
    invalidate: LESSON_QUERIES,
  })

  const archive = useLessonChange(
    archiveLessonRequest,
    t("toast.archivedTitle", { title: lesson.title })
  )

  const restore = useLessonChange(
    restoreLessonRequest,
    t("toast.restoredTitle", { title: lesson.title })
  )

  const remove = useLessonChange(
    deleteLessonRequest,
    t("toast.deletedTitle", { title: lesson.title }),
    () => router.push(routes.stageLessons(stage.id))
  )

  if (lesson.archivedAt) {
    return flags.restore ? (
      <Button disabled={restore.pending} onClick={() => void restore.execute(lesson.id)}>
        {t("common.restore")}
      </Button>
    ) : null
  }

  const back =
    flags.manage && lesson.status === "ready"
      ? { label: t("lessons.actions.backToDraft"), status: "draft" as const }
      : flags.manage && lesson.status === "completed"
        ? { label: t("lessons.actions.notTaughtYet"), status: "ready" as const }
        : null

  const set = (status: LessonStatus) => void change.execute(lesson.id, status)
  const menu = back || flags.archive || flags.delete

  return (
    <>
      {flags.manage ? (
        <Button variant="outline" asChild>
          <Link href={routes.editLesson(lesson.id)}>
            <PencilLine data-icon="inline-start" />
            {t("common.edit")}
          </Link>
        </Button>
      ) : null}
      {flags.manage && lesson.status === "draft" ? (
        <Button disabled={change.pending} onClick={() => set("ready")}>
          {t("lessons.actions.markReady")}
        </Button>
      ) : null}
      {flags.markCompleted ? (
        <Button disabled={change.pending} onClick={() => set("completed")}>
          {t("lessons.actions.markTaught")}
        </Button>
      ) : null}
      {menu ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("common.moreActions")}>
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {back ? (
              <DropdownMenuItem onSelect={() => set(back.status)}>{back.label}</DropdownMenuItem>
            ) : null}
            {back && (flags.archive || flags.delete) ? <DropdownMenuSeparator /> : null}
            {flags.archive ? (
              <DropdownMenuItem onSelect={() => setDialog("archive")}>
                {t("common.archive")}
              </DropdownMenuItem>
            ) : null}
            {flags.delete ? (
              <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
                {t("lessons.actions.deleteDraft")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <ConfirmDialog
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("lessons.actions.archiveTitle", { title })}
        description={t("lessons.actions.archiveDescription")}
        consequences={
          homework.published > 0
            ? [
                t("lessons.actions.archiveHomework", { count: homework.published }),
                t("lessons.actions.archiveKept"),
              ]
            : undefined
        }
        confirmLabel={t("common.archive")}
        onConfirm={() => archive.execute(lesson.id)}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("lessons.actions.deleteTitle", { title })}
        description={t("lessons.actions.deleteDescription")}
        confirmLabel={t("lessons.actions.deleteDraft")}
        tone="destructive"
        onConfirm={() => remove.execute(lesson.id)}
      />
    </>
  )
}
