"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { NoAccess } from "@/components/no-access"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { useCan } from "@/features/identity/auth/session"
import { type Stage, stageQuery } from "@/features/organization/stages/api"
import { StageEditorFrame } from "@/features/learning/editor-shell"
import { useSearchParamId } from "@/hooks/use-search-param-id"
import { Link } from "@/i18n/navigation"
import type { Uuid } from "@/lib/api/types/common"
import { groupAt } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { type HomeworkList, stageHomeworkQuery } from "./api"
import { HomeworkForm } from "./homework-form"

function LessonFirst({ stageId }: { stageId: Uuid }) {
  const t = useTranslations("homework.new")

  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyTitle>{t("lessonFirstTitle")}</EmptyTitle>
        <EmptyDescription>{t("lessonFirst")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" asChild>
          <Link href={routes.newLesson(stageId)}>
            <Plus data-icon="inline-start" />
            {t("newLesson")}
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}

function lessonFrom(list: HomeworkList, wanted: Uuid | null): Uuid | null {
  return wanted && list.lessons.some((l) => l.id === wanted) ? wanted : null
}

function firstLesson(list: HomeworkList, wanted: Uuid | null): Uuid {
  return lessonFrom(list, wanted) ?? list.defaultLessonId ?? list.lessons[0]!.id
}

function NewHomeworkBody({ stage, data }: { stage: Stage; data: HomeworkList }) {
  const t = useTranslations("homework")
  const can = useCan()
  const wanted = useSearchParamId("lesson")
  const group = groupAt(stage.service, stage)

  if (data.archived || !can("create", "homework", group)) {
    return (
      <NoAccess title={t("new.noAccessTitle")}>{t("new.noAccess", { stage: stage.name })}</NoAccess>
    )
  }

  if (data.lessons.length === 0) {
    return <LessonFirst stageId={stage.id} />
  }

  return (
    <HomeworkForm
      stage={data.stage}
      group={group}
      audienceSize={data.audienceSize}
      lessons={data.lessons}
      lessonId={firstLesson(data, wanted)}
      fromLesson={lessonFrom(data, wanted)}
    />
  )
}

function NewHomework({ stageId }: { stageId: Uuid }) {
  const t = useTranslations("homework")
  const stage = useQuery(stageQuery(stageId))
  const list = useQuery(stageHomeworkQuery(stageId))

  return (
    <QueryState query={stage} notFound={<RecordNotFound area="services" />}>
      {(s) => (
        <StageEditorFrame
          stage={s}
          tab="homework"
          title={t("newHomework")}
          description={t("new.description")}
        >
          <QueryState query={list}>
            {(data) => <NewHomeworkBody stage={s} data={data} />}
          </QueryState>
        </StageEditorFrame>
      )}
    </QueryState>
  )
}

export function NewHomeworkPage() {
  return (
    <RecordPage param="stage" notFound={<RecordNotFound area="services" />}>
      {(stageId) => <NewHomework stageId={stageId} />}
    </RecordPage>
  )
}
