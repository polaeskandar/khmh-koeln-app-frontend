"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { NoAccess } from "@/components/no-access"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { StageEditorFrame } from "@/features/learning/editor-shell"
import { useCan } from "@/features/identity/auth/session"
import { groupAt } from "@/lib/permissions"

import { type LessonDetail, lessonQuery } from "./api"
import { LessonForm } from "./lesson-form"
import { WithOptions } from "./lesson-options"

function EditLessonBody({ data }: { data: LessonDetail }) {
  const t = useTranslations("lessons")
  const can = useCan()
  const group = groupAt(data.service, data.stage)

  if (data.lesson.archivedAt) {
    return <NoAccess title={t("noAccess.archivedTitle")}>{t("noAccess.archivedBody")}</NoAccess>
  }

  if (data.archived || !can("update", "lessons", group)) {
    return (
      <NoAccess title={t("noAccess.changeTitle")}>
        {t("noAccess.changeBody", { stage: data.stage.name })}
      </NoAccess>
    )
  }

  return (
    <WithOptions stage={data.stage} lesson={data.lesson.id}>
      {(choices) => (
        <LessonForm
          stage={data.stage}
          lesson={data.lesson}
          viewNotes={can("read", "members", group)}
          choices={choices}
        />
      )}
    </WithOptions>
  )
}

function EditLesson({ id }: { id: string }) {
  const t = useTranslations("lessons")
  const query = useQuery(lessonQuery(id))

  return (
    <QueryState query={query} notFound={<RecordNotFound area="services" />}>
      {(data) => (
        <StageEditorFrame
          stage={{ ...data.stage, service: data.service }}
          tab="lessons"
          title={t("editLesson")}
          description={t("newDescription")}
        >
          <EditLessonBody data={data} />
        </StageEditorFrame>
      )}
    </QueryState>
  )
}

export function EditLessonPage() {
  return (
    <RecordPage notFound={<RecordNotFound area="services" />}>
      {(id) => <EditLesson key={id} id={id} />}
    </RecordPage>
  )
}
