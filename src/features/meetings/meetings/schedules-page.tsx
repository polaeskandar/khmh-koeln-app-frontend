"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { CalendarClock } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Suspense } from "react"

import { Topbar } from "@/features/portals/staff/topbar"
import { PageBody, PageHeader } from "@/components/page-header"
import { NotAssigned } from "@/components/not-assigned"
import { QueryState } from "@/components/page-states"
import { ServiceTag } from "@/components/service-tag"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useCan, useUnassigned } from "@/features/identity/auth/session"
import { servicesQuery } from "@/features/organization/services/api"
import { Link } from "@/i18n/navigation"
import type { ServiceRef } from "@/lib/api/types/common"
import { orderOf } from "./agenda-order"
import type { ScheduleSummary } from "@/lib/api/types/meetings"
import { meetingGroup } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { type ScheduleList as Schedules, schedulesQuery } from "./api"
import { MeetingsTabs, ServiceFilter, withQuery } from "./meetings-nav"
import { EditScheduleButton, NewScheduleButton } from "./schedule-dialog"
import { ScheduleList } from "./schedule-list"

type Status = "active" | "inactive" | "all"

const STATUSES: Record<Status, (schedule: ScheduleSummary) => boolean> = {
  active: (s) => s.active,
  inactive: (s) => !s.active,
  all: () => true,
}

const statusOf = (value: string | null): Status =>
  value === "inactive" || value === "all" ? value : "active"

function compareSchedules(a: ScheduleSummary, b: ScheduleSummary) {
  return (
    orderOf(a) - orderOf(b) ||
    (a.stage?.name ?? "").localeCompare(b.stage?.name ?? "", "de") ||
    a.startTime.localeCompare(b.startTime)
  )
}

function groupByService(schedules: ScheduleSummary[]) {
  const groups = new Map<string, { service: ServiceRef | null; schedules: ScheduleSummary[] }>()

  for (const schedule of schedules) {
    const key = schedule.service?.id ?? ""
    const group = groups.get(key) ?? { service: schedule.service, schedules: [] }
    group.schedules.push(schedule)
    groups.set(key, group)
  }

  return [...groups.values()]
    .sort(
      (a, b) =>
        Number(a.service?.archived ?? true) - Number(b.service?.archived ?? true) ||
        (a.service?.name ?? "").localeCompare(b.service?.name ?? "", "de")
    )
    .map((group) => ({ ...group, schedules: group.schedules.sort(compareSchedules) }))
}

function Schedules({
  list,
  status,
  serviceId,
}: {
  list: Schedules
  status: Status
  serviceId: string | null
}) {
  const t = useTranslations("meetings.schedules")
  const can = useCan()
  const inService = list.items.filter((s) => !serviceId || s.service?.id === serviceId)
  const groups = groupByService(inService.filter(STATUSES[status]))

  const tabs: { key: Status; label: string }[] = [
    { key: "active", label: t("active", { count: inService.filter(STATUSES.active).length }) },
    {
      key: "inactive",
      label: t("inactive", { count: inService.filter(STATUSES.inactive).length }),
    },
    { key: "all", label: t("all") },
  ]

  return (
    <>
      <nav aria-label={t("statusNav")} className="inline-flex h-9 w-fit items-center bg-muted p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={withQuery(routes.schedules(), {
              status: tab.key === "active" ? null : tab.key,
              service: serviceId,
            })}
            aria-current={status === tab.key ? "page" : undefined}
            className={cn(
              "inline-flex h-7 items-center px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase",
              status === tab.key && "bg-background text-foreground shadow-xs"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {groups.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClock />
            </EmptyMedia>
            <EmptyTitle>
              {status === "inactive" ? t("emptyInactiveTitle") : t("emptyTitle")}
            </EmptyTitle>
            <EmptyDescription>
              {status === "inactive" ? t("emptyInactiveDescription") : t("emptyDescription")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-10">
          {groups.map((group) => (
            <section
              key={group.service?.id ?? ""}
              aria-label={group.service?.name}
              className="flex flex-col gap-3"
            >
              <h2 className="font-heading text-base font-semibold tracking-tight">
                <ServiceTag service={group.service} className="text-base text-foreground" />
              </h2>
              <ScheduleList
                schedules={group.schedules}
                today={list.today}
                showService={false}
                emptyText={t("emptyService")}
                trailing={(schedule) =>
                  can("update", "sessions", meetingGroup(schedule)) ? (
                    <EditScheduleButton schedule={schedule} today={list.today} />
                  ) : null
                }
              />
            </section>
          ))}
        </div>
      )}
    </>
  )
}

function SchedulesScreen() {
  const t = useTranslations()
  const can = useCan()
  const unassigned = useUnassigned()
  const search = useSearchParams()
  const status = statusOf(search.get("status"))
  const serviceId = search.get("service")
  const schedules = useQuery(schedulesQuery)
  const services = useQuery(servicesQuery)
  const active = services.data?.items.filter((service) => !service.archived) ?? []

  return (
    <>
      <Topbar
        crumbs={[
          { label: t("nav.meetings"), href: routes.meetings() },
          { label: t("meetings.tabs.schedules") },
        ]}
      />
      <PageBody>
        <PageHeader
          title={t("nav.meetings")}
          description={t("meetings.schedules.description")}
          actions={
            schedules.data && can("create", "sessions") && active.length > 0 ? (
              <NewScheduleButton today={schedules.data.today} />
            ) : null
          }
        />
        {unassigned ? (
          <NotAssigned />
        ) : (
          <>
            <MeetingsTabs active="schedules" />
            <div className="flex justify-end">
              <ServiceFilter
                services={active}
                value={serviceId}
                path={routes.schedules()}
                query={{ status: status === "active" ? null : status }}
              />
            </div>
            <QueryState query={schedules}>
              {(list) => <Schedules list={list} status={status} serviceId={serviceId} />}
            </QueryState>
          </>
        )}
      </PageBody>
    </>
  )
}

export function SchedulesPage() {
  return (
    <Suspense>
      <SchedulesScreen />
    </Suspense>
  )
}
