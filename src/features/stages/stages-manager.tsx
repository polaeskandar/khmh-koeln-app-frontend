"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { NotFoundState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { type ServiceStages, serviceStagesQuery } from "@/features/services/api"
import { Link } from "@/i18n/navigation"
import { useFormat } from "@/i18n/format"
import { routes } from "@/lib/routes"

import { AddStageButton, RestoreStageButton, StageActionsMenu } from "./stage-dialogs"

function Manager({ data }: { data: ServiceStages }) {
  const t = useTranslations()
  const f = useFormat()
  const { service } = data
  const stages = [...data.stages].sort((a, b) => a.position - b.position)
  const manage = data.can.manageStructure

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
          actions={manage ? <AddStageButton service={service} /> : null}
        />
        {stages.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyDescription>
                {t("stages.manager.empty", { name: service.name })}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <th scope="col" className="w-12 py-2 text-start">
                  {t("stages.manager.columns.position")}
                </th>
                <th scope="col" className="py-2 text-start">
                  {t("stages.manager.columns.stage")}
                </th>
                <th scope="col" className="w-24 py-2 text-end">
                  {t("stages.manager.columns.members")}
                </th>
                {manage ? (
                  <th scope="col" className="w-12 py-2">
                    <span className="sr-only">{t("stages.manager.columns.actions")}</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {stages.map((stage, index) => (
                <tr key={stage.id} className="border-b">
                  <td className="py-3 text-muted-foreground tabular-nums">{index + 1}</td>
                  <td className="py-3">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <Link
                        href={routes.stage(stage.id)}
                        className="font-medium hover:underline hover:underline-offset-4"
                      >
                        {stage.name}
                      </Link>
                      {stage.description ? (
                        <span dir="auto" className="truncate text-xs text-muted-foreground">
                          {stage.description}
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="py-3 text-end tabular-nums">{stage.memberCount}</td>
                  {manage ? (
                    <td className="py-3 text-end">
                      <StageActionsMenu service={service} stage={stage} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data.archivedStages.length > 0 ? (
          <Section id="archived-stages" title={t("stages.manager.archived")}>
            <ul className="divide-y border-y">
              {data.archivedStages.map((stage) => (
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

function LoadedManager({ id }: { id: string }) {
  const query = useQuery(serviceStagesQuery(id))

  return (
    <QueryState query={query} notFound={<NotFoundPage />}>
      {(data) => <Manager data={data} />}
    </QueryState>
  )
}

export function StagesManager() {
  return <RecordPage notFound={<NotFoundPage />}>{(id) => <LoadedManager id={id} />}</RecordPage>
}
