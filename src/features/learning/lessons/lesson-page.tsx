"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Ellipsis, PencilLine, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { ConfirmDialog } from "@/components/confirm-dialog"

import { MemberAvatar } from "@/components/member-avatar"
import { PageBody, PageHeader } from "@/components/page-header"
import { NotFoundState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import type { LessonStatus } from "@/lib/api/types/learning"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"

import { initialsOf } from "@/features/identity/role-summary"
import { routes } from "@/lib/routes"

import {
  archiveLessonRequest,
  changeLessonStatusRequest,
  deleteLessonRequest,
  type LessonDetail,
  lessonQuery,
  linesOf,
  restoreLessonRequest,
} from "@/features/learning/lessons/api"
import { LessonStatusBadge, MeetingLine } from "@/features/learning/lessons/lesson-bits"
import { LessonPanel } from "@/features/learning/lessons/visibility"

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
  const queryClient = useQueryClient()

  const mutation = useApiMutation(fn, {
    successMessage,
    invalidate: [["lessons"], ["homework"]],
    onSuccess,
  })

  return {
    pending: mutation.pending,
    execute: async (...args: A) => {
      const result = await mutation.execute(...args)

      if (!result.ok) {
        void queryClient.invalidateQueries({ queryKey: ["lessons"] })
      }

      return result.ok
    },
  }
}

function StatusActions({ data }: { data: LessonDetail }) {
  const t = useTranslations()
  const router = useRouter()
  const { lesson, stage, homework, can } = data
  const [dialog, setDialog] = useState<"archive" | "delete" | null>(null)
  const title = isolate(lesson.title)

  const change = useApiMutation(changeLessonStatusRequest, {
    successMessage: (saved) => t(STATUS_TOAST[saved.status]),
    invalidate: [["lessons"]],
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
    return can.restore ? (
      <Button disabled={restore.pending} onClick={() => void restore.execute(lesson.id)}>
        {t("common.restore")}
      </Button>
    ) : null
  }

  const back =
    can.manage && lesson.status === "ready"
      ? { label: t("lessons.actions.backToDraft"), status: "draft" as const }
      : can.manage && lesson.status === "completed"
        ? { label: t("lessons.actions.notTaughtYet"), status: "ready" as const }
        : null

  const set = (status: LessonStatus) => void change.execute(lesson.id, status)
  const menu = back || can.archive || can.delete

  return (
    <>
      {can.manage ? (
        <Button variant="outline" asChild>
          <Link href={routes.editLesson(lesson.id)}>
            <PencilLine data-icon="inline-start" />
            {t("common.edit")}
          </Link>
        </Button>
      ) : null}
      {can.manage && lesson.status === "draft" ? (
        <Button disabled={change.pending} onClick={() => set("ready")}>
          {t("lessons.actions.markReady")}
        </Button>
      ) : null}
      {can.manage && lesson.status === "ready" && can.markCompleted ? (
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
            {back && (can.archive || can.delete) ? <DropdownMenuSeparator /> : null}
            {can.archive ? (
              <DropdownMenuItem onSelect={() => setDialog("archive")}>
                {t("common.archive")}
              </DropdownMenuItem>
            ) : null}
            {can.delete ? (
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

function ServantLine({ name, seed, role }: { name: string; seed?: string; role: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <MemberAvatar name={name} initials={initialsOf(name)} seed={seed} className="size-7" />
      <span className="flex min-w-0 flex-col leading-tight">
        <bdi className="font-medium">{name}</bdi>
        <span className="text-xs text-muted-foreground">{role}</span>
      </span>
    </li>
  )
}

function TextList({
  lines,
  empty,
  ordered = false,
}: {
  lines: string[]
  empty: string
  ordered?: boolean
}) {
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }

  const List = ordered ? "ol" : "ul"

  return (
    <List
      dir="auto"
      className={
        ordered ? "flex list-decimal flex-col gap-1 ps-5" : "flex list-disc flex-col gap-1 ps-5"
      }
    >
      {lines.map((line, index) => (
        <li key={index}>{line}</li>
      ))}
    </List>
  )
}

function LessonView({ data }: { data: LessonDetail }) {
  const t = useTranslations()
  const f = useFormat()
  const { lesson, stage, service, today, homework, can } = data

  return (
    <>
      <Topbar
        crumbs={[
          { label: t("nav.services"), href: routes.services() },
          { label: service.name, href: routes.service(service.id) },
          { label: t("stages.title"), href: routes.serviceStages(service.id) },
          { label: stage.name, href: routes.stage(stage.id) },
          { label: t("stages.tabs.lessons"), href: routes.stageLessons(stage.id) },
          { label: lesson.title },
        ]}
      />
      <PageBody>
        <PageHeader
          meta={<LessonStatusBadge status={lesson.status} archived={!!lesson.archivedAt} />}
          title={lesson.title}
          description={lesson.summary ? <span dir="auto">{lesson.summary}</span> : null}
          actions={<StatusActions data={data} />}
        >
          <MeetingLine meeting={lesson.meeting} today={today} />
          {can.manage && lesson.status === "ready" && lesson.teachingDate > today ? (
            <p className="text-sm text-muted-foreground">
              {t("lessons.detail.readyHint", { date: f.dayMonth(lesson.teachingDate) })}
            </p>
          ) : null}
        </PageHeader>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <div className="flex min-w-0 flex-col gap-6">
            <LessonPanel title={t("lessons.fields.teachingPlan")} who="servants">
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">{t("lessons.fields.objectives")}</h3>
                  {lesson.objectives ? (
                    <p dir="auto" className="whitespace-pre-line">
                      {lesson.objectives}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">{t("lessons.detail.noObjectives")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">{t("lessons.fields.teachingPoints")}</h3>
                  <TextList
                    ordered
                    lines={linesOf(lesson.teachingPoints)}
                    empty={t("lessons.detail.noTeachingPoints")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">{t("lessons.fields.activities")}</h3>
                  <TextList
                    lines={linesOf(lesson.activities)}
                    empty={t("lessons.detail.noActivities")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">{t("lessons.fields.materials")}</h3>
                  {lesson.materials.length === 0 ? (
                    <p className="text-muted-foreground">{t("lessons.detail.noMaterials")}</p>
                  ) : (
                    <ul className="flex list-disc flex-col gap-1 ps-5">
                      {lesson.materials.map((material, index) => (
                        <li key={index} dir="auto">
                          {material.url ? (
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-4"
                            >
                              {material.label || material.url}
                            </a>
                          ) : (
                            material.label
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {lesson.notes ? (
                  <div className="flex flex-col gap-1">
                    <h3 className="font-medium">{t("lessons.fields.notes")}</h3>
                    <p dir="auto" className="whitespace-pre-line">
                      {lesson.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            </LessonPanel>
            <LessonPanel
              title={t("lessons.detail.homework")}
              actions={
                can.manageHomework ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={routes.newHomework(stage.id, lesson.id)}>
                      <Plus data-icon="inline-start" />
                      {t("lessons.detail.addHomework")}
                    </Link>
                  </Button>
                ) : null
              }
            >
              <p className="text-sm text-muted-foreground">
                {homework.total > 0 ? (
                  <Link
                    href={routes.stageHomework(stage.id)}
                    className="underline underline-offset-4"
                  >
                    {[
                      t("counts.homework", { count: homework.total }),
                      homework.drafts > 0
                        ? t("lessons.list.drafts", { count: homework.drafts })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Link>
                ) : (
                  t("lessons.detail.noHomework")
                )}
              </p>
            </LessonPanel>
          </div>
          <aside className="flex min-w-0 flex-col gap-6">
            <LessonPanel title={t("lessons.detail.sharedWithParents")} who="parents">
              <div className="flex flex-col gap-2 text-sm">
                <p dir="auto">{lesson.passage ?? t("lessons.detail.noPassage")}</p>
                <p dir="auto" className="whitespace-pre-line text-muted-foreground">
                  {lesson.memoryVerse ?? t("lessons.detail.noMemoryVerse")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("lessons.detail.sharedHint", { count: homework.published })}
                </p>
              </div>
            </LessonPanel>
            <LessonPanel title={t("lessons.fields.servants")}>
              <ul className="flex flex-col gap-2 text-sm">
                <ServantLine
                  name={lesson.responsible?.name ?? t("common.formerAccount")}
                  seed={lesson.responsible?.id}
                  role={t("lessons.fields.responsible")}
                />
                {lesson.collaborators.map((helper, index) => (
                  <ServantLine
                    key={helper?.id ?? index}
                    name={helper?.name ?? t("common.formerAccount")}
                    seed={helper?.id}
                    role={t("lessons.detail.helping")}
                  />
                ))}
              </ul>
              {lesson.meeting.kind === "session" ? (
                <Button variant="outline" size="sm" asChild className="self-start">
                  <Link href={routes.session(lesson.meeting.id)}>
                    {t("lessons.detail.openSession")}
                  </Link>
                </Button>
              ) : null}
            </LessonPanel>
          </aside>
        </div>
      </PageBody>
    </>
  )
}

function NotFoundPage() {
  const t = useTranslations("nav")

  return (
    <>
      <Topbar crumbs={[{ label: t("services"), href: routes.services() }]} />
      <NotFoundState home={routes.services()} />
    </>
  )
}

function LoadedLesson({ id }: { id: string }) {
  const query = useQuery(lessonQuery(id))

  return (
    <QueryState query={query} notFound={<NotFoundPage />}>
      {(data) => <LessonView data={data} />}
    </QueryState>
  )
}

export function LessonPage() {
  return <RecordPage notFound={<NotFoundPage />}>{(id) => <LoadedLesson id={id} />}</RecordPage>
}
