"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { NoAccess } from "@/components/no-access"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { useCan } from "@/features/identity/auth/session"
import { StageEditorFrame } from "@/features/learning/editor-shell"
import { useSearchParamId } from "@/hooks/use-search-param-id"
import type { Uuid } from "@/lib/api/types/common"
import { groupAt, within } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { homeworkFlagsFor, homeworkQuery } from "./api"
import { HomeworkForm } from "./homework-form"

function EditHomework({ id }: { id: Uuid }) {
  const t = useTranslations("homework")
  const can = useCan()
  const fromLesson = useSearchParamId("lesson")
  const query = useQuery(homeworkQuery(id))

  return (
    <QueryState query={query} notFound={<RecordNotFound area="services" />}>
      {(data) => (
        <StageEditorFrame
          stage={{ ...data.stage, service: data.service }}
          tab="homework"
          title={t("edit.title", { title: data.title })}
        >
          {data.status === "archived" ? (
            <NoAccess
              title={t("edit.archivedTitle")}
              back={{ href: routes.homework(data.id), label: t("edit.backToHomework") }}
            >
              {t("edit.archived")}
            </NoAccess>
          ) : !homeworkFlagsFor(within(can, groupAt(data.service, data.stage)), data, data.archived)
              .edit ? (
            <NoAccess title={t("edit.noAccessTitle")}>
              {t("edit.noAccess", { stage: data.stage.name })}
            </NoAccess>
          ) : (
            <HomeworkForm
              stage={data.stage}
              group={groupAt(data.service, data.stage)}
              audienceSize={data.audienceSize}
              fromLesson={fromLesson}
              homework={data}
            />
          )}
        </StageEditorFrame>
      )}
    </QueryState>
  )
}

export function EditHomeworkPage() {
  return (
    <RecordPage notFound={<RecordNotFound area="services" />}>
      {(id) => <EditHomework id={id} />}
    </RecordPage>
  )
}
