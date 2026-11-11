"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { RecordNotFound } from "@/components/app-shell/record-not-found"
import { NoAccess } from "@/components/no-access"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { StageEditorPage } from "@/features/learning/editor-shell"
import { useCan } from "@/features/identity/auth/session"
import { ApiError } from "@/lib/api/problem"
import { groupAt } from "@/lib/permissions"

import {
  type LessonOptions,
  lessonOptionsQuery,
  lessonQuery,
  type LessonStage,
  stageLessonsQuery,
} from "./api"
import { LessonForm } from "./lesson-form"

function WithOptions({
  stage,
  lesson,
  children,
}: {
  stage: LessonStage
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
  const can = useCan()
  const query = useQuery(stageLessonsQuery(stageId))

  return (
    <QueryState query={query} notFound={<RecordNotFound area="services" />}>
      {(data) => (
        <StageEditorPage
          stage={{ ...data.stage, service: data.service }}
          tab="lessons"
          title={t("newLesson")}
          description={t("newDescription")}
        >
          {!data.archived && can("create", "lessons", groupAt(data.service, data.stage)) ? (
            <WithOptions stage={data.stage}>
              {(choices) => <LessonForm stage={data.stage} viewNotes choices={choices} />}
            </WithOptions>
          ) : (
            <NoAccess title={t("noAccess.prepareTitle")}>
              {t("noAccess.prepareBody", { stage: data.stage.name })}
            </NoAccess>
          )}
        </StageEditorPage>
      )}
    </QueryState>
  )
}

function EditLesson({ id }: { id: string }) {
  const t = useTranslations("lessons")
  const can = useCan()
  const query = useQuery(lessonQuery(id))

  return (
    <QueryState query={query} notFound={<RecordNotFound area="services" />}>
      {(data) => (
        <StageEditorPage
          stage={{ ...data.stage, service: data.service }}
          tab="lessons"
          title={t("editLesson")}
          description={t("newDescription")}
        >
          {data.lesson.archivedAt ? (
            <NoAccess title={t("noAccess.archivedTitle")}>{t("noAccess.archivedBody")}</NoAccess>
          ) : data.archived || !can("update", "lessons", groupAt(data.service, data.stage)) ? (
            <NoAccess title={t("noAccess.changeTitle")}>
              {t("noAccess.changeBody", { stage: data.stage.name })}
            </NoAccess>
          ) : (
            <WithOptions stage={data.stage} lesson={data.lesson.id}>
              {(choices) => (
                <LessonForm
                  stage={data.stage}
                  lesson={data.lesson}
                  viewNotes={can("read", "members", groupAt(data.service, data.stage))}
                  choices={choices}
                />
              )}
            </WithOptions>
          )}
        </StageEditorPage>
      )}
    </QueryState>
  )
}

export function NewLessonPage() {
  return (
    <RecordPage param="stage" notFound={<RecordNotFound area="services" />}>
      {(stageId) => <NewLesson stageId={stageId} />}
    </RecordPage>
  )
}

export function EditLessonPage() {
  return (
    <RecordPage notFound={<RecordNotFound area="services" />}>
      {(id) => <EditLesson key={id} id={id} />}
    </RecordPage>
  )
}
