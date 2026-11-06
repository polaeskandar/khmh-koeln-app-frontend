"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { Link2, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { type Crumb, Topbar } from "@/components/app-shell/topbar"
import { focusFirstInvalid } from "@/components/focus-first-invalid"
import { FormPanel } from "@/components/form-panel"
import { TextAreaField, TextField } from "@/components/form-fields"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader } from "@/components/page-header"
import { NotFoundState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { useSession } from "@/features/auth/session"
import { Link, useRouter } from "@/i18n/navigation"
import type { ServiceRef, StageRef } from "@/lib/api/types/common"
import { ApiError } from "@/lib/api/problem"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import {
  createLessonRequest,
  type Lesson,
  type LessonInput,
  type LessonOptions,
  lessonOptionsQuery,
  lessonQuery,
  OTHER_DATE,
  optionValue,
  toLink,
  type Material,
  stageLessonsQuery,
  updateLessonRequest,
} from "./api"
import { LessonStatusBadge } from "./lesson-bits"
import { MeetingSelect } from "./meeting-select"
import { type Audience, VisibilityNote } from "./visibility"

const MAX_MATERIALS = 10
const EMPTY_MATERIAL: Material = { label: "", url: null }

const text = (value: string) => (value.trim() === "" ? null : value)

function Block({
  title,
  who,
  children,
}: {
  title: string
  who?: Audience
  children: React.ReactNode
}) {
  return (
    <FormPanel
      title={title}
      note={who ? <VisibilityNote who={who} /> : null}
      className={cn(
        who === "servants" && "bg-muted/30",
        who === "parents" && "border-s-4 border-s-success"
      )}
    >
      {children}
    </FormPanel>
  )
}

function useLessonCrumbs(service: ServiceRef, stage: StageRef, last: string): Crumb[] {
  const t = useTranslations()

  return [
    { label: t("nav.services"), href: routes.services() },
    { label: service.name, href: routes.service(service.id) },
    { label: t("stages.title"), href: routes.serviceStages(service.id) },
    { label: stage.name, href: routes.stage(stage.id) },
    { label: t("stages.tabs.lessons"), href: routes.stageLessons(stage.id) },
    { label: last },
  ]
}

type EditorProps = {
  stage: StageRef
  lesson?: Lesson
  viewNotes: boolean
  choices: LessonOptions
}

function initialMeeting(choices: LessonOptions, lesson?: Lesson) {
  if (lesson) {
    return lesson.scheduleId
      ? optionValue({ scheduleId: lesson.scheduleId, date: lesson.teachingDate })
      : OTHER_DATE
  }

  const free = choices.options.find(
    (o) => o.date > choices.today && !o.takenBy && o.state !== "canceled"
  )

  return free ? optionValue(free) : OTHER_DATE
}

function LessonForm({ stage, lesson, viewNotes, choices }: EditorProps) {
  const t = useTranslations()
  const router = useRouter()
  const { session } = useSession()
  const viewerId = session.status === "authenticated" ? session.me.account.id : ""
  const today = choices.today
  const savedMeeting = lesson ? initialMeeting(choices, lesson) : null
  const [meeting, setMeeting] = useState(() => initialMeeting(choices, lesson))
  const [otherDate, setOtherDate] = useState(lesson?.teachingDate ?? today)
  const listed = choices.servants.some((servant) => servant.id === viewerId)

  const [responsibleId, setResponsibleId] = useState(
    lesson?.responsible?.id ?? (listed ? viewerId : (choices.servants[0]?.id ?? ""))
  )

  const responsibles =
    lesson?.responsible && !choices.servants.some((s) => s.id === lesson.responsible!.id)
      ? [...choices.servants, lesson.responsible]
      : choices.servants

  const savedHelpers = (lesson?.collaborators ?? []).filter((helper) => helper !== null)
  const [helperIds, setHelperIds] = useState(() => savedHelpers.map((helper) => helper.id))

  const helpers = [
    ...choices.servants,
    ...savedHelpers.filter((saved) => !choices.servants.some((s) => s.id === saved.id)),
  ].filter((servant) => servant.id !== responsibleId)

  const helpersChanged =
    !lesson ||
    helperIds.length !== savedHelpers.length ||
    helperIds.some((id) => !savedHelpers.some((saved) => saved.id === id))

  const chooseResponsible = (id: string) => {
    setResponsibleId(id)
    setHelperIds((ids) => ids.filter((helper) => helper !== id))
  }

  const formRef = useRef<HTMLFormElement>(null)

  const [fields, setFields] = useState({
    title: lesson?.title ?? "",
    summary: lesson?.summary ?? "",
    passage: lesson?.passage ?? "",
    memoryVerse: lesson?.memoryVerse ?? "",
    objectives: lesson?.objectives ?? "",
    teachingPoints: lesson?.teachingPoints ?? "",
    activities: lesson?.activities ?? "",
    notes: lesson?.notes ?? "",
  })

  const set = (key: keyof typeof fields) => (event: { target: { value: string } }) =>
    setFields((current) => ({ ...current, [key]: event.target.value }))

  const [materials, setMaterials] = useState<Material[]>(
    lesson?.materials.length ? lesson.materials : [EMPTY_MATERIAL]
  )

  const [intent, setIntent] = useState<"draft" | "ready" | null>(null)
  const onSaved = (saved: { id: string; status: string }) => router.push(routes.lesson(saved.id))

  const successMessage = (saved: { status: string }) =>
    saved.status === "ready"
      ? t("toast.lessonSavedReady")
      : t("toast.lessonDraftSaved", { title: fields.title.trim() })

  const create = useApiMutation((input: LessonInput) => createLessonRequest(stage.id, input), {
    successMessage,
    invalidate: [["lessons"]],
    onSuccess: onSaved,
  })

  const update = useApiMutation((input: LessonInput) => updateLessonRequest(lesson!.id, input), {
    successMessage,
    invalidate: [["lessons"]],
    onSuccess: onSaved,
  })

  const mutation = lesson ? update : create
  const errors = mutation.fieldErrors
  const completed = lesson?.status === "completed"

  useEffect(() => {
    if (mutation.problem) {
      focusFirstInvalid(formRef.current)
    }
  }, [mutation.problem])

  function input(status: "draft" | "ready"): LessonInput {
    const linkChanged =
      !lesson ||
      meeting !== savedMeeting ||
      (meeting === OTHER_DATE && otherDate !== lesson.teachingDate)

    return {
      title: fields.title,
      ...(linkChanged ? toLink(meeting, otherDate, choices.options) : {}),
      summary: text(fields.summary),
      passage: text(fields.passage),
      memoryVerse: text(fields.memoryVerse),
      objectives: text(fields.objectives),
      teachingPoints: text(fields.teachingPoints),
      activities: text(fields.activities),
      materials: materials
        .filter((m) => m.label.trim() || (m.url ?? "").trim())
        .map((m) => ({ label: m.label, url: m.url?.trim() ? m.url : null })),
      ...(viewNotes ? { notes: text(fields.notes) } : {}),
      ...(!lesson || responsibleId !== lesson.responsible?.id ? { responsibleId } : {}),
      ...(helpersChanged ? { collaboratorIds: helperIds } : {}),
      ...(completed ? {} : { status }),
    }
  }

  function submit(status: "draft" | "ready") {
    setIntent(status)
    void mutation.execute(input(status))
  }

  const updateMaterial = (index: number, change: Partial<Material>) =>
    setMaterials((list) => list.map((m, i) => (i === index ? { ...m, ...change } : m)))

  return (
    <form
      ref={formRef}
      noValidate
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]"
      onSubmit={(event) => {
        event.preventDefault()
        submit(lesson?.status === "ready" ? "ready" : "draft")
      }}
    >
      <div className="flex min-w-0 flex-col gap-6">
        <Block title={t("lessons.lesson")}>
          <FieldGroup>
            <TextField
              label={t("lessons.editor.title")}
              dir="auto"
              value={fields.title}
              onChange={set("title")}
              maxLength={160}
              placeholder={t("lessons.editor.titlePlaceholder")}
              autoFocus={!lesson}
              error={errors.title}
            />
            <TextAreaField
              label={t("lessons.editor.summary")}
              optional
              dir="auto"
              value={fields.summary}
              onChange={set("summary")}
              maxLength={1000}
              placeholder={t("lessons.editor.summaryPlaceholder")}
              error={errors.summary}
            />
          </FieldGroup>
        </Block>
        <Block title={t("lessons.editor.scripture")} who="parents">
          <FieldGroup>
            <TextField
              label={t("lessons.fields.passage")}
              optional
              dir="auto"
              value={fields.passage}
              onChange={set("passage")}
              maxLength={200}
              placeholder={t("lessons.editor.passagePlaceholder")}
              error={errors.passage}
            />
            <TextAreaField
              label={t("lessons.fields.memoryVerse")}
              optional
              dir="auto"
              value={fields.memoryVerse}
              onChange={set("memoryVerse")}
              maxLength={500}
              placeholder={t("lessons.editor.memoryVersePlaceholder")}
              error={errors.memoryVerse}
            />
          </FieldGroup>
        </Block>
        <Block title={t("lessons.fields.teachingPlan")} who="servants">
          <FieldGroup>
            <TextAreaField
              label={t("lessons.fields.objectives")}
              optional
              dir="auto"
              value={fields.objectives}
              onChange={set("objectives")}
              maxLength={4000}
              placeholder={t("lessons.editor.objectivesPlaceholder")}
              error={errors.objectives}
            />
            <TextAreaField
              label={t("lessons.fields.teachingPoints")}
              optional
              dir="auto"
              value={fields.teachingPoints}
              onChange={set("teachingPoints")}
              maxLength={4000}
              description={t("lessons.editor.teachingPointsHint")}
              error={errors.teachingPoints}
            />
            <TextAreaField
              label={t("lessons.fields.activities")}
              optional
              dir="auto"
              value={fields.activities}
              onChange={set("activities")}
              maxLength={4000}
              description={t("lessons.editor.activitiesHint")}
              error={errors.activities}
            />
          </FieldGroup>
        </Block>
        <Block title={t("lessons.fields.materials")} who="servants">
          <div className="flex flex-col gap-3">
            {materials.map((material, index) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <Input
                    aria-label={t("lessons.editor.material", { n: index + 1 })}
                    aria-invalid={errors[`materials.${index}.label`] ? true : undefined}
                    placeholder={t("lessons.editor.materialPlaceholder")}
                    dir="auto"
                    value={material.label}
                    maxLength={120}
                    onChange={(event) => updateMaterial(index, { label: event.target.value })}
                  />
                  <div className="relative col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                    <Link2
                      className="pointer-events-none absolute start-0 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      aria-label={t("lessons.editor.materialLink", { n: index + 1 })}
                      aria-invalid={errors[`materials.${index}.url`] ? true : undefined}
                      placeholder={t("lessons.editor.materialLinkPlaceholder")}
                      dir="ltr"
                      className="ps-5"
                      value={material.url ?? ""}
                      onChange={(event) =>
                        updateMaterial(index, { url: event.target.value || null })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("lessons.editor.removeMaterial", { n: index + 1 })}
                    onClick={() =>
                      setMaterials((list) =>
                        list.length === 1 ? [EMPTY_MATERIAL] : list.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
                {errors[`materials.${index}.label`] || errors[`materials.${index}.url`] ? (
                  <FieldError>
                    {errors[`materials.${index}.label`] ?? errors[`materials.${index}.url`]}
                  </FieldError>
                ) : null}
              </div>
            ))}
            {errors.materials ? <FieldError>{errors.materials}</FieldError> : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              disabled={materials.length >= MAX_MATERIALS}
              onClick={() => setMaterials((list) => [...list, EMPTY_MATERIAL])}
            >
              <Plus data-icon="inline-start" />
              {t("lessons.editor.addMaterial")}
            </Button>
          </div>
        </Block>
        {viewNotes ? (
          <Block title={t("lessons.fields.notes")} who="servants">
            <TextAreaField
              label={t("lessons.editor.notesLabel")}
              optional
              dir="auto"
              value={fields.notes}
              onChange={set("notes")}
              maxLength={4000}
              placeholder={t("lessons.editor.notesPlaceholder")}
              error={errors.notes}
            />
          </Block>
        ) : null}
      </div>
      <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
        <FormPanel title={t("lessons.editor.when")}>
          <MeetingSelect
            options={choices.options}
            today={today}
            value={meeting}
            saved={savedMeeting}
            otherDate={otherDate}
            onChange={setMeeting}
            onOtherDateChange={setOtherDate}
            error={errors.meeting ?? errors.teachingDate}
          />
        </FormPanel>
        <FormPanel title={t("lessons.fields.servants")}>
          <Field data-invalid={errors.responsibleId ? true : undefined}>
            <FieldLabel htmlFor="lesson-responsible">{t("lessons.fields.responsible")}</FieldLabel>
            <NativeSelect
              id="lesson-responsible"
              className="w-full"
              value={responsibleId}
              aria-invalid={errors.responsibleId ? true : undefined}
              onChange={(event) => chooseResponsible(event.target.value)}
            >
              {responsibles.map((servant) => (
                <NativeSelectOption key={servant.id} value={servant.id}>
                  {servant.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {errors.responsibleId ? <FieldError>{errors.responsibleId}</FieldError> : null}
          </Field>
          {choices.servants.length > 1 ? (
            <FieldSet data-invalid={errors.collaboratorIds ? true : undefined}>
              <FieldLegend variant="label">{t("lessons.editor.helping")}</FieldLegend>
              <div className="flex flex-col gap-2">
                {helpers.map((servant) => (
                  <Field key={servant.id} orientation="horizontal">
                    <Checkbox
                      id={`lesson-helper-${servant.id}`}
                      checked={helperIds.includes(servant.id)}
                      aria-invalid={errors.collaboratorIds ? true : undefined}
                      onCheckedChange={(checked) =>
                        setHelperIds((ids) =>
                          checked === true
                            ? [...ids, servant.id]
                            : ids.filter((id) => id !== servant.id)
                        )
                      }
                    />
                    <FieldLabel htmlFor={`lesson-helper-${servant.id}`} className="font-normal">
                      <bdi>{servant.name}</bdi>
                    </FieldLabel>
                  </Field>
                ))}
              </div>
              {errors.collaboratorIds ? <FieldError>{errors.collaboratorIds}</FieldError> : null}
            </FieldSet>
          ) : null}
        </FormPanel>
        <FormPanel
          title={t("lessons.fields.status")}
          note={<LessonStatusBadge status={lesson?.status ?? "draft"} />}
          className="gap-3"
        >
          <p className="text-xs text-muted-foreground">{t("lessons.editor.statusHint")}</p>
          <div className="flex flex-col gap-2">
            {completed ? (
              <Button type="button" onClick={() => submit("ready")} disabled={mutation.pending}>
                {mutation.pending ? <Spinner data-icon="inline-start" /> : null}
                {t("common.saveChanges")}
              </Button>
            ) : (
              <>
                <Button type="button" onClick={() => submit("ready")} disabled={mutation.pending}>
                  {mutation.pending && intent === "ready" ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {lesson?.status === "ready" ? t("common.save") : t("lessons.actions.markReady")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => submit("draft")}
                  disabled={mutation.pending}
                >
                  {mutation.pending && intent === "draft" ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {lesson?.status === "ready"
                    ? t("lessons.editor.saveAsDraft")
                    : t("lessons.editor.saveDraft")}
                </Button>
              </>
            )}
            <Button type="button" variant="ghost" asChild>
              <Link href={lesson ? routes.lesson(lesson.id) : routes.stageLessons(stage.id)}>
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
  service,
  stage,
  title,
  children,
}: {
  service: ServiceRef
  stage: StageRef
  title: string
  children: React.ReactNode
}) {
  const t = useTranslations("lessons")

  return (
    <>
      <Topbar crumbs={useLessonCrumbs(service, stage, title)} />
      <PageBody>
        <PageHeader title={title} description={t("newDescription")} />
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

function WithOptions({
  stage,
  lesson,
  children,
}: {
  stage: StageRef
  lesson?: string
  children: (choices: LessonOptions) => React.ReactNode
}) {
  const t = useTranslations("lessons")
  const options = useQuery(lessonOptionsQuery(stage.id, lesson))
  const forbidden = options.error instanceof ApiError && options.error.status === 403

  if (forbidden) {
    return (
      <NoAccess title={t("noAccess.prepareTitle")}>
        {t("noAccess.prepareBody", { stage: stage.name })}
      </NoAccess>
    )
  }

  return <QueryState query={options}>{children}</QueryState>
}

function NewLesson({ stageId }: { stageId: string }) {
  const t = useTranslations("lessons")
  const query = useQuery(stageLessonsQuery(stageId))

  return (
    <QueryState query={query} notFound={<NotFoundPage />}>
      {(data) => (
        <EditorPage service={data.service} stage={data.stage} title={t("newLesson")}>
          {data.can.create ? (
            <WithOptions stage={data.stage}>
              {(choices) => <LessonForm stage={data.stage} viewNotes choices={choices} />}
            </WithOptions>
          ) : (
            <NoAccess title={t("noAccess.prepareTitle")}>
              {t("noAccess.prepareBody", { stage: data.stage.name })}
            </NoAccess>
          )}
        </EditorPage>
      )}
    </QueryState>
  )
}

function EditLesson({ id }: { id: string }) {
  const t = useTranslations("lessons")
  const query = useQuery(lessonQuery(id))

  return (
    <QueryState query={query} notFound={<NotFoundPage />}>
      {(data) => (
        <EditorPage service={data.service} stage={data.stage} title={t("editLesson")}>
          {data.lesson.archivedAt ? (
            <NoAccess title={t("noAccess.archivedTitle")}>{t("noAccess.archivedBody")}</NoAccess>
          ) : !data.can.manage ? (
            <NoAccess title={t("noAccess.changeTitle")}>
              {t("noAccess.changeBody", { stage: data.stage.name })}
            </NoAccess>
          ) : (
            <WithOptions stage={data.stage} lesson={data.lesson.id}>
              {(choices) => (
                <LessonForm
                  stage={data.stage}
                  lesson={data.lesson}
                  viewNotes={data.can.viewNotes}
                  choices={choices}
                />
              )}
            </WithOptions>
          )}
        </EditorPage>
      )}
    </QueryState>
  )
}

export function NewLessonPage() {
  return (
    <RecordPage param="stage" notFound={<NotFoundPage />}>
      {(stageId) => <NewLesson stageId={stageId} />}
    </RecordPage>
  )
}

export function EditLessonPage() {
  return <RecordPage notFound={<NotFoundPage />}>{(id) => <EditLesson id={id} />}</RecordPage>
}
