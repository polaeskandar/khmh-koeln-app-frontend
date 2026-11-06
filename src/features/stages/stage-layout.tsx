"use client"

import { useQuery } from "@tanstack/react-query"
import { Archive, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { type Crumb, Topbar } from "@/components/app-shell/topbar"
import { LinkTabs } from "@/components/link-tabs"
import { PageBody, PageHeader } from "@/components/page-header"
import { NotFoundState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { ServiceTag } from "@/components/service-tag"
import { StatusBadge } from "@/components/status"
import type { ServiceRef, StageRef } from "@/lib/api/types/common"
import { registrationEnabled } from "@/lib/env"
import { routes } from "@/lib/routes"

import { type Stage, stageQuery } from "./api"
import { StageMembers } from "./stage-members"

export type StageTab = "overview" | "lessons" | "homework"

function useTabLabels(): Record<StageTab, string> {
  const t = useTranslations()

  return {
    overview: t("stages.tabs.overview"),
    lessons: t("stages.tabs.lessons"),
    homework: t("stages.tabs.homework"),
  }
}

const TAB_ROUTES: Record<StageTab, (id: string) => string> = {
  overview: routes.stage,
  lessons: routes.stageLessons,
  homework: routes.stageHomework,
}

export function useStageCrumbs(
  stage: StageRef & { service: ServiceRef },
  tab: StageTab,
  extra: Crumb[] = []
): Crumb[] {
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

  const shown: StageTab[] = registrationEnabled()
    ? ["overview", "lessons", "homework"]
    : ["overview"]

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
        items={shown.map((key) => ({ key, label: tabs[key], href: TAB_ROUTES[key](stage.id) }))}
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

function NotFoundPage() {
  const t = useTranslations("nav")

  return (
    <>
      <Topbar crumbs={[{ label: t("services"), href: routes.services() }]} />
      <NotFoundState home={routes.services()} />
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
    <QueryState query={query} notFound={<NotFoundPage />}>
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
    <RecordPage notFound={<NotFoundPage />}>
      {(id) => (
        <LoadedStage id={id} tab={tab} crumbs={crumbs}>
          {children}
        </LoadedStage>
      )}
    </RecordPage>
  )
}

export function StageOverview() {
  return <StageLayout tab="overview">{(stage) => <StageMembers stage={stage} />}</StageLayout>
}
