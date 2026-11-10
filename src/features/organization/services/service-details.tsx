"use client"

import { useCan, useCanAssign } from "@/features/identity/auth/session"
import { useQuery } from "@tanstack/react-query"
import { Archive, ArrowRight, PencilLine } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { NotFoundState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { ServiceSwatch } from "@/components/service-tag"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { serviceSchedulesQuery } from "@/features/meetings/meetings/api"
import { NewScheduleButton } from "@/features/meetings/meetings/schedule-dialog"
import { ScheduleList } from "@/features/meetings/meetings/schedule-list"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import { groupAt } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import {
  type ServiceRow,
  type ServiceStages,
  serviceQuery,
  serviceStagesQuery,
  useServiceInsight,
} from "./api"
import { AddStageButton } from "@/features/organization/stages/stage-dialogs"

import { trendText } from "./service-bits"
import { ServiceActionsMenu, ServiceFormDialog } from "./service-dialogs"
import { ServiceServants } from "./service-servants"

function EditButton({ service }: { service: ServiceRow }) {
  const t = useTranslations("common")
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PencilLine data-icon="inline-start" />
        {t("edit")}
      </Button>
      <ServiceFormDialog service={service} open={open} onOpenChange={setOpen} />
    </>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border p-4">
      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <span className="font-heading text-2xl font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function Stages({ service, stages }: { service: ServiceRow; stages: ServiceStages }) {
  const t = useTranslations()
  const f = useFormat()
  const can = useCan()
  const addStages = can("create", "stages", groupAt(service)) && !service.archived

  return (
    <Section
      id="stages"
      title={t("services.detail.stats.stages")}
      description={t("services.detail.stages.description")}
      actions={
        <span className="flex items-center gap-4">
          {addStages && stages.stages.length > 0 ? (
            <AddStageButton service={stages.service} variant="outline" />
          ) : null}
          <Link
            href={routes.serviceStages(service.id)}
            className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
          >
            {t("services.detail.stages.manage")}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </span>
      }
    >
      {stages.stages.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>{t("services.detail.stages.empty")}</EmptyTitle>
            <EmptyDescription>
              {t("services.detail.stages.emptyDescription", {
                name: service.name,
                count: service.serviceLevelMemberCount ?? service.memberCount,
              })}
            </EmptyDescription>
          </EmptyHeader>
          {addStages ? (
            <EmptyContent>
              <AddStageButton
                service={stages.service}
                label={t("services.detail.stages.addFirst")}
              />
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <ul className="divide-y border-y">
          {[...stages.stages]
            .sort((a, b) => a.position - b.position)
            .map((stage) => (
              <li key={stage.id}>
                <Link
                  href={routes.stage(stage.id)}
                  className="-mx-2 flex items-center justify-between gap-3 px-2 py-3 hover:bg-muted/60"
                >
                  <span className="truncate font-medium">{stage.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {t("counts.members", { count: stage.memberCount })}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      )}
      {stages.archivedStages.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t.rich("services.detail.stages.archived", {
            names: f.list(stages.archivedStages.map((stage) => stage.name)),
            link: (chunks) => (
              <Link
                href={routes.serviceStages(service.id)}
                className="underline underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      ) : null}
    </Section>
  )
}

function Details({ service }: { service: ServiceRow }) {
  const t = useTranslations()
  const f = useFormat()
  const stages = useQuery(serviceStagesQuery(service.id))
  const schedules = useQuery(serviceSchedulesQuery(service.id))
  const can = useCan()
  const canAssign = useCanAssign()
  const insight = useServiceInsight(service.id)
  const activeSchedules = schedules.data?.items.filter((schedule) => schedule.active).length ?? 0

  return (
    <>
      <Topbar
        crumbs={[{ label: t("nav.services"), href: routes.services() }, { label: service.name }]}
      />
      <PageBody>
        <PageHeader
          meta={
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <ServiceSwatch tone={service.tone} />
              {t("services.kind")}
            </span>
          }
          title={service.name}
          description={service.description ? <span dir="auto">{service.description}</span> : null}
          actions={
            <>
              {can("create", "sessions") && !service.archived && schedules.data ? (
                <NewScheduleButton today={schedules.data.today} fixedServiceId={service.id} />
              ) : null}
              {can("update", "services", groupAt(service)) && !service.archived ? (
                <EditButton service={service} />
              ) : null}
              <ServiceActionsMenu service={service} />
            </>
          }
        />
        {service.archived && service.archivedAt ? (
          <Alert>
            <Archive />
            <AlertTitle>
              {t("services.detail.archivedOn", {
                date: f.mediumDate(f.instantDate(service.archivedAt)),
              })}
            </AlertTitle>
            <AlertDescription>{t("services.detail.archivedNote")}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t("services.detail.stats.stages")} value={stages.data?.stages.length ?? 0} />
          <Stat label={t("services.detail.stats.members")} value={service.memberCount} />
          <Stat label={t("services.detail.stats.activeSchedules")} value={activeSchedules} />
          <Stat
            label={t("services.detail.stats.attendance")}
            value={trendText(insight?.trend, f)}
          />
        </div>
        <QueryState query={stages}>
          {(data) => <Stages service={service} stages={data} />}
        </QueryState>
        <Section
          id="schedules"
          title={t("services.detail.schedules.title")}
          description={t("services.detail.schedules.description")}
        >
          <QueryState query={schedules}>
            {(list) => (
              <ScheduleList
                schedules={list.items}
                today={list.today}
                showService={false}
                emptyText={t("services.detail.schedules.empty")}
              />
            )}
          </QueryState>
        </Section>
        {canAssign(groupAt(service)) ? (
          <ServiceServants
            service={{
              id: service.id,
              name: service.name,
              stages: [...(stages.data?.stages ?? [])]
                .sort((a, b) => a.position - b.position)
                .map((stage) => ({ id: stage.id, name: stage.name })),
            }}
            archived={service.archived}
          />
        ) : null}
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

function LoadedService({ id }: { id: string }) {
  const query = useQuery(serviceQuery(id))

  return (
    <QueryState query={query} notFound={<NotFoundPage />}>
      {(service) => <Details service={service} />}
    </QueryState>
  )
}

export function ServiceDetails() {
  return <RecordPage notFound={<NotFoundPage />}>{(id) => <LoadedService id={id} />}</RecordPage>
}
