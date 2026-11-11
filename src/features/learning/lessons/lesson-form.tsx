"use client"

import { useTranslations } from "next-intl"
import { type ChangeEvent, useState } from "react"

import { FormPanel } from "@/components/form-panel"
import { Button } from "@/components/ui/button"
import { EditorForm, SaveButton } from "@/features/learning/editor-shell"
import { useLinkRows } from "@/features/learning/link-rows"
import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"
import { Link, useRouter } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import {
  createLessonRequest,
  type Lesson,
  type LessonRequest,
  type LessonOptions,
  type LessonStage,
  LESSON_QUERIES,
  meetingOf,
  OTHER_DATE,
  optionValue,
  toMeeting,
  updateLessonRequest,
} from "./api"
import { LessonStatusBadge } from "./lesson-status-badge"
import { LessonFields, type LessonTexts, lessonTextsOf } from "./lesson-fields"
import { ServantsPanel, useLessonServants } from "./lesson-servants"
import { MeetingSelect } from "./meeting-select"

type Status = "draft" | "ready"

const text = (value: string) => (value.trim() === "" ? null : value)

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

function StatusPanel({
  stage,
  lesson,
  pending,
  intent,
  onSave,
}: {
  stage: LessonStage
  lesson?: Lesson
  pending: boolean
  intent: Status | null
  onSave: (status: Status) => void
}) {
  const t = useTranslations()
  const kept: Status = lesson?.status === "ready" ? "ready" : "draft"

  const actionFor = (status: Status) =>
    status === kept
      ? ({ type: "submit" } as const)
      : ({ type: "button", onClick: () => onSave(status) } as const)

  return (
    <FormPanel
      title={t("lessons.fields.status")}
      note={<LessonStatusBadge status={lesson?.status ?? "draft"} />}
      className="gap-3"
    >
      <p className="text-xs text-muted-foreground">{t("lessons.editor.statusHint")}</p>
      <div className="flex flex-col gap-2">
        {lesson?.status === "completed" ? (
          <SaveButton type="submit" pending={pending} active>
            {t("common.saveChanges")}
          </SaveButton>
        ) : (
          <>
            <SaveButton {...actionFor("ready")} pending={pending} active={intent === "ready"}>
              {lesson?.status === "ready" ? t("common.save") : t("lessons.actions.markReady")}
            </SaveButton>
            <SaveButton
              {...actionFor("draft")}
              variant="outline"
              pending={pending}
              active={intent === "draft"}
            >
              {lesson?.status === "ready"
                ? t("lessons.editor.saveAsDraft")
                : t("lessons.editor.saveDraft")}
            </SaveButton>
          </>
        )}
        <Button type="button" variant="ghost" asChild>
          <Link href={lesson ? routes.lesson(lesson.id) : routes.stageLessons(stage.id)}>
            {t("common.cancel")}
          </Link>
        </Button>
      </div>
    </FormPanel>
  )
}

export function LessonForm({
  stage,
  lesson,
  viewNotes,
  choices,
}: {
  stage: LessonStage
  lesson?: Lesson
  viewNotes: boolean
  choices: LessonOptions
}) {
  const t = useTranslations()
  const router = useRouter()
  const savedMeeting = lesson ? initialMeeting(choices, lesson) : null
  const [meeting, setMeeting] = useState(() => initialMeeting(choices, lesson))
  const [otherDate, setOtherDate] = useState(lesson?.teachingDate ?? choices.today)
  const [texts, setTexts] = useState(() => lessonTextsOf(lesson))
  const [version] = useState(lesson?.version ?? 0)
  const [intent, setIntent] = useState<Status | null>(null)
  const servants = useLessonServants(choices, lesson)
  const materials = useLinkRows(lesson?.materials ?? [], { keepOneRow: true })

  const save = useApiMutation(
    (input: LessonRequest) =>
      lesson
        ? updateLessonRequest(lesson.id, version, input)
        : createLessonRequest(stage.id, input),
    {
      successMessage: (saved) =>
        saved.status === "ready"
          ? t("toast.lessonSavedReady")
          : t("toast.lessonDraftSaved", { title: texts.title.trim() }),
      invalidate: LESSON_QUERIES,
      onSuccess: (saved) => router.push(routes.lesson(saved.id)),
    }
  )

  const formRef = useFocusFirstInvalid(save.problem)

  const changeText = (key: keyof LessonTexts) => (event: ChangeEvent<{ value: string }>) =>
    setTexts((current) => ({ ...current, [key]: event.target.value }))

  function meetingFor(saved?: Lesson) {
    const kept =
      meeting === savedMeeting && (meeting !== OTHER_DATE || otherDate === saved?.teachingDate)

    return saved && kept ? meetingOf(saved) : toMeeting(meeting, otherDate, choices.options)
  }

  function input(status: Status): LessonRequest {
    return {
      details: {
        title: texts.title,
        summary: text(texts.summary),
        passage: text(texts.passage),
        memoryVerse: text(texts.memoryVerse),
        collaboratorIds: servants.helperIds,
      },
      meeting: meetingFor(lesson),
      plan: {
        objectives: text(texts.objectives),
        teachingPoints: text(texts.teachingPoints),
        activities: text(texts.activities),
        ...(viewNotes ? { notes: text(texts.notes) } : {}),
        materials: materials.toPayload(),
      },
      responsibleId: servants.responsibleId,
      ...(lesson?.status === "completed" ? {} : { status }),
    }
  }

  function saveAs(status: Status) {
    if (save.pending) {
      return
    }

    setIntent(status)
    void save.execute(input(status))
  }

  return (
    <EditorForm
      formRef={formRef}
      onSubmit={() => saveAs(lesson?.status === "ready" ? "ready" : "draft")}
      aside={
        <>
          <FormPanel title={t("lessons.editor.when")}>
            <MeetingSelect
              options={choices.options}
              today={choices.today}
              value={meeting}
              saved={savedMeeting}
              otherDate={otherDate}
              onChange={setMeeting}
              onOtherDateChange={setOtherDate}
              error={save.fieldErrors.meeting}
            />
          </FormPanel>
          <ServantsPanel servants={servants} errors={save.fieldErrors} />
          <StatusPanel
            stage={stage}
            lesson={lesson}
            pending={save.pending}
            intent={intent}
            onSave={saveAs}
          />
        </>
      }
    >
      <LessonFields
        texts={texts}
        errors={save.fieldErrors}
        onChange={changeText}
        materials={materials}
        isNew={!lesson}
        viewNotes={viewNotes}
      />
    </EditorForm>
  )
}
