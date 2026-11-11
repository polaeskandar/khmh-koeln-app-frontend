"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { Topbar } from "@/features/portals/staff/topbar"
import { PageBody, PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { useStageCrumbs } from "@/features/organization/stages/stage-layout"
import { useFormat } from "@/i18n/format"

import { type LessonDetail, lessonQuery } from "./api"
import { LessonActions, useLessonFlags } from "./lesson-actions"
import { LessonStatusBadge } from "./lesson-status-badge"
import { MeetingLine } from "./meeting-line"
import { SharedWithParents, TeachingPlan } from "./lesson-content"
import { LessonHomework } from "./lesson-homework"
import { LessonTeam } from "./lesson-team"

function LessonView({ data }: { data: LessonDetail }) {
  const t = useTranslations()
  const f = useFormat()
  const { lesson, stage, service, today } = data
  const flags = useLessonFlags(data)
  const crumbs = useStageCrumbs({ ...stage, service }, "lessons", [{ label: lesson.title }])

  return (
    <>
      <Topbar crumbs={crumbs} />
      <PageBody>
        <PageHeader
          meta={<LessonStatusBadge status={lesson.status} archived={!!lesson.archivedAt} />}
          title={lesson.title}
          description={lesson.summary ? <span dir="auto">{lesson.summary}</span> : null}
          actions={<LessonActions data={data} flags={flags} />}
        >
          <MeetingLine meeting={lesson.meeting} today={today} />
          {flags.manage && lesson.status === "ready" && lesson.teachingDate > today ? (
            <p className="text-sm text-muted-foreground">
              {t("lessons.detail.readyHint", { date: f.dayMonth(lesson.teachingDate) })}
            </p>
          ) : null}
        </PageHeader>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <div className="flex min-w-0 flex-col gap-6">
            <TeachingPlan lesson={lesson} />
            <LessonHomework data={data} canAdd={flags.addHomework} />
          </div>
          <aside className="flex min-w-0 flex-col gap-6">
            <SharedWithParents data={data} />
            <LessonTeam lesson={lesson} />
          </aside>
        </div>
      </PageBody>
    </>
  )
}

function LoadedLesson({ id }: { id: string }) {
  const query = useQuery(lessonQuery(id))

  return (
    <QueryState query={query} notFound={<RecordNotFound area="services" />}>
      {(data) => <LessonView data={data} />}
    </QueryState>
  )
}

export function LessonPage() {
  return (
    <RecordPage notFound={<RecordNotFound area="services" />}>
      {(id) => <LoadedLesson id={id} />}
    </RecordPage>
  )
}
