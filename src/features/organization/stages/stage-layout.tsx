"use client"

import { useQuery } from "@tanstack/react-query"
import { Archive, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { type Crumb, Topbar } from "@/features/portals/staff/topbar"
import { LinkTabs } from "@/components/link-tabs"
import { PageBody, PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { ServiceTag } from "@/components/service-tag"
import { StatusBadge } from "@/components/status"
import type { ServiceRef, StageRef } from "@/lib/api/types/common"
import { routes } from "@/lib/routes"

import { type Stage, stageQuery } from "./api"

export type StageTab = "overview" | "attendance" | "lessons" | "homework"

const STAGE_TABS: StageTab[] = ["overview", "attendance", "lessons", "homework"]

function useTabLabels(): Record<StageTab, string> {
  const t = useTranslations()

  return {
    overview: t("stages.tabs.overview"),
    attendance: t("nav.attendance"),
    lessons: t("stages.tabs.lessons"),
    homework: t("stages.tabs.homework"),
  }
}

const TAB_ROUTES: Record<StageTab, (id: string) => string> = {
  overview: routes.stage,
  attendance: routes.stageAttendance,
  lessons: routes.stageLessons,
  homework: routes.stageHomework,
}

export type StageCrumbsOf = Pick<StageRef, "id" | "name"> & { service: ServiceRef }

export function useStageCrumbs(stage: StageCrumbsOf, tab: StageTab, extra: Crumb[] = []): Crumb[] {
  const t = useTranslations()
  const tabs = useTabLabels()

  const crumbs: Crumb[] = [
    { label: t("nav.services"), href: routes.services() },
    { label: stage.service.name, href: routes.service(stage.service.id) },
    { label: t("stages.title"), href: routes.serviceStages(stage.service.id) },
    { label: stage.name, href: routes.stage(stage.id) },
  ]

  if (tab !== "overview") {
    crumbs.push({ label: tabs[tab], href: TAB_ROUTES[tab](stage.id) })
  }

  return [...crumbs, ...extra]
}

function StageHeader({ stage, tab }: { stage: Stage; tab: StageTab }) {
  const t = useTranslations()
  const tabs = useTabLabels()

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        meta={
          <>
            <ServiceTag service={stage.service} />
            <span className="text-muted-foreground">· {t("stages.kind")}</span>
            {stage.archived ? (
              <StatusBadge tone="muted" icon={Archive}>
                {t("common.archived")}
              </StatusBadge>
            ) : null}
          </>
        }
        title={stage.name}
      >
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <UsersRound className="size-3.5" aria-hidden="true" />
          {t("counts.members", { count: stage.memberCount })}
        </p>
      </PageHeader>
      <LinkTabs
        label={t("stages.sections", { name: stage.name })}
        active={tab}
        items={STAGE_TABS.map((key) => ({
          key,
          label: tabs[key],
          href: TAB_ROUTES[key](stage.id),
        }))}
      />
    </div>
  )
}

function StageFrame({
  stage,
  tab,
  crumbs,
  children,
}: {
  stage: Stage
  tab: StageTab
  crumbs: Crumb[]
  children: ReactNode
}) {
  return (
    <>
      <Topbar crumbs={useStageCrumbs(stage, tab, crumbs)} />
      <PageBody>
        <StageHeader stage={stage} tab={tab} />
        {children}
      </PageBody>
    </>
  )
}

function LoadedStage({
  id,
  tab,
  crumbs,
  children,
}: {
  id: string
  tab: StageTab
  crumbs: Crumb[]
  children: (stage: Stage) => ReactNode
}) {
  const query = useQuery(stageQuery(id))

  return (
    <QueryState query={query} notFound={<RecordNotFound area="services" />}>
      {(stage) => (
        <StageFrame stage={stage} tab={tab} crumbs={crumbs}>
          {children(stage)}
        </StageFrame>
      )}
    </QueryState>
  )
}

export function StageLayout({
  tab,
  crumbs = [],
  children,
}: {
  tab: StageTab
  crumbs?: Crumb[]
  children: (stage: Stage) => ReactNode
}) {
  return (
    <RecordPage notFound={<RecordNotFound area="services" />}>
      {(id) => (
        <LoadedStage id={id} tab={tab} crumbs={crumbs}>
          {children}
        </LoadedStage>
      )}
    </RecordPage>
  )
}
