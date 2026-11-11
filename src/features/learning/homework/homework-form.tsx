"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { FormPanel } from "@/components/form-panel"
import { FormField, SelectField, TextAreaField, TextField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelectOption } from "@/components/ui/native-select"
import { useCanIn } from "@/features/identity/auth/session"
import { EditorForm, SaveButton } from "@/features/learning/editor-shell"
import { HomeworkStatusBadge } from "./homework-status-badge"
import { LinkRowsEditor, useLinkRows } from "@/features/learning/link-rows"
import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import type { LessonOnDate } from "@/features/learning/lessons/api"
import type { LocalDate, Uuid } from "@/lib/api/types/common"
import { addDays } from "@/lib/domain/time"
import type { Group } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { type HomeworkDetail, homeworkFlagsFor, type HomeworkList } from "./api"
import { type SaveStep, useSaveHomework } from "./use-save-homework"

const QUICK_PICK = "h-auto min-h-9 shrink py-2 text-start whitespace-normal"

const weekAfter = (date: LocalDate) => addDays(date, 7)

type HomeworkStage = HomeworkList["stage"]

type FormProps = {
  stage: HomeworkStage
  group: Group
  audienceSize: number
  fromLesson: Uuid | null
} & ({ lessons: LessonOnDate[]; lessonId: Uuid; homework?: never } | { homework: HomeworkDetail })

function DueDatePanel({
  value,
  min,
  weekAfterLesson,
  error,
  onChange,
}: {
  value: string
  min: LocalDate
  weekAfterLesson: LocalDate
  error?: string
  onChange: (date: string) => void
}) {
  const t = useTranslations("homework.editor")
  const f = useFormat()

  return (
    <FormPanel title={t("dueDate")} optional>
      <FormField label={t("dueDate")} hideLabel description={t("dueHint")} error={error}>
        {(control) => (
          <>
            <Input
              {...control}
              type="date"
              min={min}
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={QUICK_PICK}
                onClick={() => onChange(weekAfterLesson)}
              >
                {t("weekAfter", { date: f.dayMonth(weekAfterLesson) })}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={QUICK_PICK}
                onClick={() => onChange("")}
              >
                {t("clearDue")}
              </Button>
            </div>
          </>
        )}
      </FormField>
    </FormPanel>
  )
}

function StatusPanel({
  stage,
  homework,
  audienceSize,
  canPublish,
  pending,
  step,
  lessonPage,
  onPublish,
}: {
  stage: HomeworkStage
  homework?: HomeworkDetail
  audienceSize: number
  canPublish: boolean
  pending: boolean
  step: SaveStep
  lessonPage: string | null
  onPublish: () => void
}) {
  const t = useTranslations()
  const published = homework?.status === "published"

  return (
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
          : t("homework.editor.hiddenUntilPublished", { count: audienceSize, stage: stage.name })}
      </p>
      <div className="flex flex-col gap-2">
        {!published && canPublish ? (
          <SaveButton
            type="button"
            pending={pending}
            active={step === "publish"}
            onClick={onPublish}
          >
            {t("homework.actions.publishToParents")}
          </SaveButton>
        ) : null}
        <SaveButton
          type="submit"
          variant={!published && canPublish ? "outline" : "default"}
          pending={pending}
          active={step === "save"}
        >
          {published ? t("common.saveChanges") : t("homework.editor.saveDraft")}
        </SaveButton>
        <Button type="button" variant="ghost" asChild>
          <Link
            href={
              lessonPage ??
              (published ? routes.homework(homework.id) : routes.stageHomework(stage.id))
            }
          >
            {t("common.cancel")}
          </Link>
        </Button>
      </div>
    </FormPanel>
  )
}

export function HomeworkForm(props: FormProps) {
  const { stage, group, audienceSize, fromLesson, homework } = props
  const lessons = homework ? [homework.lesson] : props.lessons
  const t = useTranslations("homework")
  const f = useFormat()
  const can = useCanIn(group)
  const [lessonId, setLessonId] = useState(homework ? homework.lesson.id : props.lessonId)
  const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0]!
  const [title, setTitle] = useState(homework?.title ?? "")
  const [instructions, setInstructions] = useState(homework?.instructions ?? "")

  const [dueDate, setDueDate] = useState(
    homework ? (homework.dueDate ?? "") : weekAfter(lesson.teachingDate)
  )

  const resources = useLinkRows(homework?.resources ?? [], { keepOneRow: false })
  const save = useSaveHomework({ stageId: stage.id, lessonId, homework, fromLesson })
  const errors = save.fieldErrors
  const formRef = useFocusFirstInvalid(save.problem)
  const lessonLabel = (l: LessonOnDate) => `${f.dayMonth(l.teachingDate)} · ${l.title}`

  const canPublish = homework
    ? homeworkFlagsFor(can, homework, homework.archived).publish
    : can("update", "homework")

  const fields = () => ({
    title,
    instructions,
    dueDate: dueDate || null,
    resources: resources.toPayload(),
  })

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

  return (
    <EditorForm
      formRef={formRef}
      onSubmit={() => void save.submit("save", fields)}
      aside={
        <>
          <DueDatePanel
            value={dueDate}
            min={homework ? homework.minDueDate : lesson.teachingDate}
            weekAfterLesson={weekAfter(lesson.teachingDate)}
            error={errors.dueDate}
            onChange={setDueDate}
          />
          <StatusPanel
            stage={stage}
            homework={homework}
            audienceSize={audienceSize}
            canPublish={canPublish}
            pending={save.pending}
            step={save.step}
            lessonPage={save.lessonPage}
            onPublish={() => void save.submit("publish", fields)}
          />
        </>
      }
    >
      <FormPanel title={t("editor.lesson")}>
        {homework ? (
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("editor.givenWith")}</span>
            <Link href={routes.lesson(homework.lesson.id)} className="underline underline-offset-4">
              <bdi>{lessonLabel(homework.lesson)}</bdi>
            </Link>
            <p className="text-xs text-muted-foreground">{t("editor.lessonNote")}</p>
          </div>
        ) : (
          <SelectField
            label={t("editor.givenWith")}
            description={t("editor.lessonNote")}
            value={lessonId}
            disabled={save.savedId !== null}
            onChange={(event) => chooseLesson(event.target.value)}
          >
            {lessons.map((l) => (
              <NativeSelectOption key={l.id} value={l.id}>
                {lessonLabel(l)}
              </NativeSelectOption>
            ))}
          </SelectField>
        )}
      </FormPanel>
      <FormPanel title={t("editor.homework")}>
        <FieldGroup>
          <TextField
            label={t("editor.titleLabel")}
            dir="auto"
            value={title}
            maxLength={120}
            placeholder={t("editor.titlePlaceholder")}
            onChange={(event) => setTitle(event.target.value)}
            error={errors.title}
          />
          <TextAreaField
            label={t("editor.instructionsLabel")}
            dir="auto"
            rows={5}
            value={instructions}
            maxLength={2000}
            placeholder={t("editor.instructionsPlaceholder")}
            description={t("editor.instructionsHint")}
            onChange={(event) => setInstructions(event.target.value)}
            error={errors.instructions}
          />
        </FieldGroup>
      </FormPanel>
      <FormPanel title={t("editor.resources")} optional>
        <div className="flex flex-col gap-3">
          {resources.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("editor.resourcesEmpty")}</p>
          ) : null}
          <LinkRowsEditor
            links={resources}
            errors={errors}
            prefix="resources"
            texts={{
              label: (n) => t("editor.resource", { n }),
              link: (n) => t("editor.resourceLink", { n }),
              remove: (n) => t("editor.resourceRemove", { n }),
              labelPlaceholder: t("editor.resourcePlaceholder"),
              linkPlaceholder: "https://",
              add: t("editor.addResource"),
            }}
          />
        </div>
      </FormPanel>
    </EditorForm>
  )
}
