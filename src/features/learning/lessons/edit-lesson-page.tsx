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

import { lessonQuery } from "./api"
import { LessonForm } from "./lesson-form"

import { WithOptions } from "./lesson-options"

function EditLesson({ id }: { id: string }) {
  const t = useTranslations("lessons")
  const can = useCan()
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
