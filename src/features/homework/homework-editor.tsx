"use client"

import { useQuery } from "@tanstack/react-query"
import { Link2, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useId, useRef, useState } from "react"
import { toast } from "sonner"

import { Topbar } from "@/components/app-shell/topbar"
import { focusFirstInvalid } from "@/components/focus-first-invalid"
import { FormPanel } from "@/components/form-panel"
import { TextAreaField, TextField } from "@/components/form-fields"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader } from "@/components/page-header"
import { NotFoundState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { HomeworkStatusBadge } from "@/features/lessons/lesson-bits"
import { stageQuery } from "@/features/stages/api"
import { useStageCrumbs } from "@/features/stages/stage-layout"
import { useSearchParamId } from "@/hooks/use-search-param-id"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import type { LessonRef, LocalDate, ServiceRef, StageRef, Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { addDays } from "@/lib/domain/time"
import { routes } from "@/lib/routes"

import {
  createHomeworkRequest,
  type HomeworkDetail,
  type HomeworkInput,
  homeworkQuery,
  type Resource,
  type StageHomework,
  stageHomeworkQuery,
  updateHomeworkRequest,
} from "./api"
import { usePublishHomework } from "./use-publish-homework"

const MAX_RESOURCES = 10
const EMPTY_RESOURCE: Resource = { label: "", url: null }

const weekAfter = (date: LocalDate) => addDays(date, 7)
const isBlank = (resource: Resource) => !resource.label.trim() && !(resource.url ?? "").trim()

type FormProps = {
  stage: StageRef
  audienceSize: number
} & ({ lessons: LessonRef[]; lessonId: Uuid; homework?: never } | { homework: HomeworkDetail })

function HomeworkForm(props: FormProps) {
  const { stage, audienceSize, homework } = props
  const lessons = homework ? [homework.lesson] : props.lessons
  const t = useTranslations()
  const f = useFormat()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const dueId = useId()
  const lessonSelectId = useId()
  const [lessonId, setLessonId] = useState(homework ? homework.lesson.id : props.lessonId)
  const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0]!
  const [title, setTitle] = useState(homework?.title ?? "")
  const [instructions, setInstructions] = useState(homework?.instructions ?? "")

  const [dueDate, setDueDate] = useState(
    homework ? (homework.dueDate ?? "") : weekAfter(lesson.teachingDate)
  )

  const [resources, setResources] = useState<Resource[]>(homework?.resources ?? [])
  const [sent, setSent] = useState<number[]>([])
  const [savedId, setSavedId] = useState<Uuid | null>(homework?.id ?? null)
  const [intent, setIntent] = useState<"save" | "publish">("save")
  const busy = useRef(false)

  const mutation = useApiMutation(
    (input: HomeworkInput) =>
      savedId ? updateHomeworkRequest(savedId, input) : createHomeworkRequest(lessonId, input),
    { invalidate: [["homework"]] }
  )

  const publisher = usePublishHomework(t("toast.homeworkPublishedNew"))
  const errors = mutation.fieldErrors
  const published = homework?.status === "published"
  const canPublish = homework ? homework.can.publish : true
  const pending = mutation.pending || publisher.pending
  const listOn = (status: string) => `${routes.stageHomework(stage.id)}&status=${status}`
  const lessonLabel = (l: LessonRef) => `${f.dayMonth(l.teachingDate)} · ${l.title}`

  useEffect(() => {
    if (mutation.problem) {
      focusFirstInvalid(formRef.current)
    }
  }, [mutation.problem])

  const resourceError = (row: number, key: "label" | "url") => {
    const index = sent.indexOf(row)

    return index < 0 ? undefined : errors[`resources.${index}.${key}`]
  }

  function chooseLesson(id: string) {
    const next = lessons.find((l) => l.id === id)

    if (!next) {
      return
    }

    if (dueDate === weekAfter(lesson.teachingDate)) {
      setDueDate(weekAfter(next.teachingDate))
    }

    setLessonId(id)
  }

  function updateResource(row: number, change: Partial<Resource>) {
    setResources((list) => list.map((r, i) => (i === row ? { ...r, ...change } : r)))
  }

  function removeResource(row: number) {
    setResources((list) => list.filter((_, i) => i !== row))
    setSent((list) => list.map((i) => (i === row ? -1 : i > row ? i - 1 : i)))
  }

  async function submit(next: "save" | "publish") {
    if (busy.current) {
      return
    }

    busy.current = true
    setIntent(next)

    try {
      const kept = resources.flatMap((r, i) => (isBlank(r) ? [] : [i]))
      setSent(kept)

      const saved = await mutation.execute({
        title,
        instructions,
        dueDate: dueDate || null,
        resources: kept.map((i) => {
          const { label, url } = resources[i]!

          return { label, url: url?.trim() ? url : null }
        }),
      })

      if (!saved.ok) {
        return
      }

      setSavedId(saved.data.id)

      if (next === "save") {
        toast.success(
          saved.data.status === "published"
            ? t("toast.homeworkSavedPublished")
            : homework
              ? t("toast.homeworkSavedDraft")
              : t("toast.homeworkDraftSaved")
        )

        router.push(listOn(saved.data.status))

        return
      }

      const result = await publisher.publish({ id: saved.data.id, title })

      if (result?.ok) {
        router.push(listOn("published"))
      } else if (!homework) {
        router.replace(routes.editHomework(saved.data.id))
      }
    } finally {
      busy.current = false
    }
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]"
      onSubmit={(event) => {
        event.preventDefault()
        void submit("save")
      }}
    >
      <div className="flex min-w-0 flex-col gap-6">
        <FormPanel title={t("homework.editor.lesson")}>
          {homework ? (
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{t("homework.editor.givenWith")}</span>
              <Link
                href={routes.lesson(homework.lesson.id)}
                className="underline underline-offset-4"
              >
                <bdi>{lessonLabel(homework.lesson)}</bdi>
              </Link>
              <p className="text-xs text-muted-foreground">{t("homework.editor.lessonNote")}</p>
            </div>
          ) : (
            <Field>
              <FieldLabel htmlFor={lessonSelectId}>{t("homework.editor.givenWith")}</FieldLabel>
              <NativeSelect
                id={lessonSelectId}
                className="w-full"
                value={lessonId}
                disabled={savedId !== null}
                onChange={(event) => chooseLesson(event.target.value)}
              >
                {lessons.map((l) => (
                  <NativeSelectOption key={l.id} value={l.id}>
                    {lessonLabel(l)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>{t("homework.editor.lessonNote")}</FieldDescription>
            </Field>
          )}
        </FormPanel>
        <FormPanel title={t("homework.editor.homework")}>
          <FieldGroup>
            <TextField
              label={t("homework.editor.titleLabel")}
              dir="auto"
              value={title}
              maxLength={120}
              placeholder={t("homework.editor.titlePlaceholder")}
              onChange={(event) => setTitle(event.target.value)}
              error={errors.title}
            />
            <TextAreaField
              label={t("homework.editor.instructionsLabel")}
              dir="auto"
              rows={5}
              value={instructions}
              maxLength={2000}
              placeholder={t("homework.editor.instructionsPlaceholder")}
              description={t("homework.editor.instructionsHint")}
              onChange={(event) => setInstructions(event.target.value)}
              error={errors.instructions}
            />
          </FieldGroup>
        </FormPanel>
        <FormPanel title={t("homework.editor.resources")} optional>
          <div className="flex flex-col gap-3">
            {resources.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("homework.editor.resourcesEmpty")}</p>
            ) : null}
            {resources.map((resource, row) => (
              <div key={row} className="flex flex-col gap-1">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <Input
                    aria-label={t("homework.editor.resource", { n: row + 1 })}
                    aria-invalid={resourceError(row, "label") ? true : undefined}
                    placeholder={t("homework.editor.resourcePlaceholder")}
                    dir="auto"
                    value={resource.label}
                    maxLength={120}
                    onChange={(event) => updateResource(row, { label: event.target.value })}
                  />
                  <div className="relative col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                    <Link2
                      className="pointer-events-none absolute start-0 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      aria-label={t("homework.editor.resourceLink", { n: row + 1 })}
                      aria-invalid={resourceError(row, "url") ? true : undefined}
                      placeholder="https://"
                      dir="ltr"
                      className="ps-5"
                      value={resource.url ?? ""}
                      onChange={(event) => updateResource(row, { url: event.target.value || null })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("homework.editor.resourceRemove", { n: row + 1 })}
                    onClick={() => removeResource(row)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                {resourceError(row, "label") || resourceError(row, "url") ? (
                  <FieldError>
                    {resourceError(row, "label") ?? resourceError(row, "url")}
                  </FieldError>
                ) : null}
              </div>
            ))}
            {errors.resources ? <FieldError>{errors.resources}</FieldError> : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              disabled={resources.length >= MAX_RESOURCES}
              onClick={() => setResources((list) => [...list, EMPTY_RESOURCE])}
            >
              <Plus data-icon="inline-start" />
              {t("homework.editor.addResource")}
            </Button>
          </div>
        </FormPanel>
      </div>
      <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
        <FormPanel title={t("homework.editor.dueDate")} optional>
          <Field data-invalid={errors.dueDate ? true : undefined}>
            <FieldLabel htmlFor={dueId} className="sr-only">
              {t("homework.editor.dueDate")}
            </FieldLabel>
            <Input
              id={dueId}
              type="date"
              min={homework ? homework.minDueDate : lesson.teachingDate}
              value={dueDate}
              aria-invalid={errors.dueDate ? true : undefined}
              aria-describedby={`${dueId}-${errors.dueDate ? "error" : "hint"}`}
              onChange={(event) => setDueDate(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDueDate(weekAfter(lesson.teachingDate))}
              >
                {t("homework.editor.weekAfter", {
                  date: f.dayMonth(weekAfter(lesson.teachingDate)),
                })}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setDueDate("")}>
                {t("homework.editor.clearDue")}
              </Button>
            </div>
            {errors.dueDate ? (
              <FieldError id={`${dueId}-error`}>{errors.dueDate}</FieldError>
            ) : (
              <FieldDescription id={`${dueId}-hint`}>
                {t("homework.editor.dueHint")}
              </FieldDescription>
            )}
          </Field>
        </FormPanel>
        <FormPanel
          title={t("homework.table.status")}
          note={<HomeworkStatusBadge status={homework?.status ?? "draft"} />}
          className="gap-3"
        >
          <p className="text-xs text-muted-foreground">
            {published
              ? t("homework.editor.visible", {
                  count: audienceSize,
                  stage: stage.name,
                  completions: homework.counts?.completed ?? 0,
                })
              : t("homework.editor.hiddenUntilPublished", {
                  count: audienceSize,
                  stage: stage.name,
                })}
          </p>
          <div className="flex flex-col gap-2">
            {!published && canPublish ? (
              <Button type="button" disabled={pending} onClick={() => void submit("publish")}>
                {pending && intent === "publish" ? <Spinner data-icon="inline-start" /> : null}
                {t("homework.actions.publishToParents")}
              </Button>
            ) : null}
            <Button
              type="submit"
              variant={!published && canPublish ? "outline" : "default"}
              disabled={pending}
            >
              {pending && intent === "save" ? <Spinner data-icon="inline-start" /> : null}
              {published ? t("common.saveChanges") : t("homework.editor.saveDraft")}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link
                href={published ? routes.homework(homework.id) : routes.stageHomework(stage.id)}
              >
                {t("common.cancel")}
              </Link>
            </Button>
          </div>
        </FormPanel>
      </aside>
    </form>
  )
}

function EditorPage({
  stage,
  service,
  title,
  description,
  children,
}: {
  stage: StageRef
  service: ServiceRef
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <>
      <Topbar crumbs={useStageCrumbs({ ...stage, service }, "homework", [{ label: title }])} />
      <PageBody>
        <PageHeader title={title} description={description} />
        {children}
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

function LessonFirst({ stage }: { stage: Uuid }) {
  const t = useTranslations("homework.new")

  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyTitle>{t("lessonFirstTitle")}</EmptyTitle>
        <EmptyDescription>{t("lessonFirst")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" asChild>
          <Link href={routes.newLesson(stage)}>
            <Plus data-icon="inline-start" />
            {t("newLesson")}
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}

function firstLesson(data: StageHomework, wanted: Uuid | null): Uuid {
  if (wanted && data.lessons.some((l) => l.id === wanted)) {
    return wanted
  }

  return data.defaultLessonId ?? data.lessons[0]!.id
}

function NewHomework({ stageId }: { stageId: Uuid }) {
  const t = useTranslations("homework")
  const wanted = useSearchParamId("lesson")
  const stage = useQuery(stageQuery(stageId))
  const list = useQuery(stageHomeworkQuery(stageId))

  return (
    <QueryState query={stage} notFound={<NotFoundPage />}>
      {(s) => (
        <EditorPage
          stage={s}
          service={s.service}
          title={t("newHomework")}
          description={t("new.description")}
        >
          <QueryState query={list}>
            {(data) =>
              !data.can.create ? (
                <NoAccess title={t("new.noAccessTitle")}>
                  {t("new.noAccess", { stage: s.name })}
                </NoAccess>
              ) : data.lessons.length === 0 ? (
                <LessonFirst stage={s.id} />
              ) : (
                <HomeworkForm
                  stage={data.stage}
                  audienceSize={data.audienceSize}
                  lessons={data.lessons}
                  lessonId={firstLesson(data, wanted)}
                />
              )
            }
          </QueryState>
        </EditorPage>
      )}
    </QueryState>
  )
}

function EditHomework({ id }: { id: Uuid }) {
  const t = useTranslations("homework")
  const query = useQuery(homeworkQuery(id))

  return (
    <QueryState query={query} notFound={<NotFoundPage />}>
      {(data) => (
        <EditorPage
          stage={data.stage}
          service={data.service}
          title={t("edit.title", { title: data.title })}
        >
          {data.status === "archived" ? (
            <NoAccess
              title={t("edit.archivedTitle")}
              back={{ href: routes.homework(data.id), label: t("edit.backToHomework") }}
            >
              {t("edit.archived")}
            </NoAccess>
          ) : !data.can.edit ? (
            <NoAccess title={t("edit.noAccessTitle")}>
              {t("edit.noAccess", { stage: data.stage.name })}
            </NoAccess>
          ) : (
            <HomeworkForm stage={data.stage} audienceSize={data.audienceSize} homework={data} />
          )}
        </EditorPage>
      )}
    </QueryState>
  )
}

export function NewHomeworkPage() {
  return (
    <RecordPage param="stage" notFound={<NotFoundPage />}>
      {(stageId) => <NewHomework stageId={stageId} />}
    </RecordPage>
  )
}

export function EditHomeworkPage() {
  return <RecordPage notFound={<NotFoundPage />}>{(id) => <EditHomework id={id} />}</RecordPage>
}
