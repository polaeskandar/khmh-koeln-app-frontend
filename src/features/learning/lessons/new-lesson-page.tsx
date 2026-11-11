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

import { stageLessonsQuery } from "./api"
import { LessonForm } from "./lesson-form"
import { WithOptions } from "./lesson-options"

function NewLesson({ stageId }: { stageId: string }) {
  const t = useTranslations("lessons")
  const can = useCan()
  const query = useQuery(stageLessonsQuery(stageId))

  return (
    <QueryState query={query} notFound={<RecordNotFound area="services" />}>
      {(data) => (
        <StageEditorFrame
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
        </StageEditorFrame>
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
