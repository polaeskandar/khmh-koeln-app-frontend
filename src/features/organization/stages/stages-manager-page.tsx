"use client"

import { useCan } from "@/features/identity/auth/session"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { Topbar } from "@/features/portals/staff/topbar"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { type ServiceStages, serviceStagesQuery } from "@/features/organization/services/api"
import { useFormat } from "@/i18n/format"
import { groupAt } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { AddStageButton } from "./stage-dialog"
import { RestoreStageButton } from "./stage-actions"
import { StagesTable } from "./stages-table"
import { useStageOrder } from "./use-stage-order"

function ArchivedStages({
  stages,
  manage,
}: {
  stages: ServiceStages["archivedStages"]
  manage: boolean
}) {
  const t = useTranslations()
  const f = useFormat()

  if (stages.length === 0) {
    return null
  }

  return (
    <Section id="archived-stages" title={t("stages.manager.archived")}>
      <ul className="divide-y border-y">
        {stages.map((stage) => (
          <li key={stage.id} className="flex items-center justify-between gap-3 py-3">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium text-muted-foreground">
                <bdi>{stage.name}</bdi>
              </span>
              {stage.archivedAt ? (
                <span className="text-xs text-muted-foreground">
                  {t("services.detail.archivedOn", {
                    date: f.mediumDate(f.instantDate(stage.archivedAt)),
                  })}
                </span>
              ) : null}
            </span>
            {manage ? <RestoreStageButton stage={stage} /> : null}
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Manager({ data }: { data: ServiceStages }) {
  const t = useTranslations()
  const can = useCan()
  const { service } = data
  const manage = can("update", "stages", groupAt(service)) && !service.archived
  const stageOrder = useStageOrder(service.id, data.stages)
  const count = stageOrder.rows.length

  return (
    <>
      <Topbar
        crumbs={[
          { label: t("nav.services"), href: routes.services() },
          { label: service.name, href: routes.service(service.id) },
          { label: t("stages.title") },
        ]}
      />
      <PageBody>
        <PageHeader
          title={t("stages.page.title", { name: service.name })}
          description={manage && count > 1 ? t("stages.page.hint") : undefined}
          actions={
            can("create", "stages", groupAt(service)) && !service.archived ? (
              <AddStageButton service={service} />
            ) : null
          }
        />
        {count === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyDescription>
                {t("stages.manager.empty", { name: service.name })}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <StagesTable service={service} manage={manage} stageOrder={stageOrder} />
        )}
        <ArchivedStages stages={data.archivedStages} manage={manage} />
      </PageBody>
    </>
  )
}

function LoadedManager({ id }: { id: string }) {
  const query = useQuery(serviceStagesQuery(id))

  return (
    <QueryState query={query} notFound={<RecordNotFound area="services" />}>
      {(data) => <Manager data={data} />}
    </QueryState>
  )
}

export function StagesManagerPage() {
  return (
    <RecordPage notFound={<RecordNotFound area="services" />}>
      {(id) => <LoadedManager id={id} />}
    </RecordPage>
  )
}
