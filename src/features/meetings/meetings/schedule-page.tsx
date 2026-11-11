"use client"

import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { Ellipsis, Repeat } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ReactNode, useState } from "react"

import { RecordNotFound } from "@/components/app-shell/record-not-found"
import { Topbar } from "@/components/app-shell/topbar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { ServiceTag } from "@/components/service-tag"
import { AgendaRow } from "@/components/session-bits"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useCanIn } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { useRouter } from "@/i18n/navigation"
import type { LocalDate } from "@/lib/api/types/common"
import { type AgendaItem, groupOf, type ScheduleSummary } from "@/lib/api/types/meetings"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { recurrenceOf } from "@/lib/domain/recurrence"
import { addDays } from "@/lib/domain/time"
import { meetingGroup } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import {
  activateScheduleRequest,
  deactivateScheduleRequest,
  deleteScheduleRequest,
  scheduleQuery,
  agendaQuery,
  SCHEDULE_DELETION_QUERIES,
  SCHEDULE_QUERIES,
} from "./api"
import { OccurrenceMenu } from "./occurrence-menu"
import { EditScheduleButton } from "./schedule-dialog"

const NEXT_DATES = 8
const PAST_SESSIONS = 12
const DAYS = 119

const itemKey = (item: AgendaItem) =>
  item.kind === "planned" ? `${item.scheduleId}-${item.date}` : item.id

function archivedPart(schedule: ScheduleSummary) {
  if (schedule.service?.archived) {
    return { kind: "service" as const, name: schedule.service.name }
  }

  if (schedule.stage?.archived) {
    return { kind: "stage" as const, name: schedule.stage.name }
  }

  return null
}

function Actions({ schedule, today }: { schedule: ScheduleSummary; today: LocalDate }) {
  const t = useTranslations()
  const router = useRouter()
  const can = useCanIn(meetingGroup(schedule))
  const [dialog, setDialog] = useState<"deactivate" | "delete" | null>(null)
  const name = isolate(schedule.name)
  const archived = archivedPart(schedule)

  const activate = useApiMutation(activateScheduleRequest, {
    successMessage: (saved) => t("toast.scheduleActivated", { created: saved.createdSessions }),
    invalidate: SCHEDULE_QUERIES,
  })

  const deactivate = useApiMutation(deactivateScheduleRequest, {
    successMessage: t("toast.scheduleDeactivated"),
    invalidate: SCHEDULE_QUERIES,
  })

  const remove = useApiMutation(deleteScheduleRequest, {
    successMessage: t("toast.scheduleDeleted"),
    invalidate: SCHEDULE_DELETION_QUERIES,
    onSuccess: () => router.push(routes.schedules()),
  })

  const manages = can("update", "sessions")
  const deletes = can("delete", "sessions")

  if (!manages && !deletes) {
    return null
  }

  return (
    <>
      {manages ? <EditScheduleButton schedule={schedule} today={today} /> : null}
      {schedule.active || !manages ? null : (
        <span className="flex flex-col items-start gap-1">
          <Button
            disabled={activate.pending || archived !== null}
            onClick={() => void activate.execute(schedule.id)}
          >
            {t("meetings.actions.activate")}
          </Button>
          {archived ? (
            <span className="text-xs text-muted-foreground">
              {t("meetings.schedule.archived", { name: archived.name })}
            </span>
          ) : null}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t("common.moreActions")}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {schedule.active && manages ? (
            <DropdownMenuItem onSelect={() => setDialog("deactivate")}>
              {t("meetings.actions.deactivate")}
            </DropdownMenuItem>
          ) : null}
          {deletes ? (
            <DropdownMenuItem
              variant="destructive"
              disabled={schedule.sessionCount > 0}
              onSelect={() => setDialog("delete")}
            >
              {schedule.sessionCount > 0
                ? t("meetings.actions.cantDelete")
                : t("meetings.actions.delete")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={dialog === "deactivate"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("meetings.actions.deactivateTitle", { name })}
        description={t("meetings.actions.deactivateDescription")}
        consequences={[
          t("meetings.actions.deactivateExisting"),
          t("meetings.actions.deactivateHistory", { count: schedule.sessionCount }),
        ]}
        confirmLabel={t("meetings.actions.deactivate")}
        onConfirm={async () => (await deactivate.execute(schedule.id)).ok}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("meetings.actions.deleteTitle", { name })}
        description={t("meetings.actions.deleteDescription")}
        confirmLabel={t("meetings.actions.delete")}
        tone="destructive"
        onConfirm={async () => (await remove.execute(schedule.id)).ok}
      />
    </>
  )
}

function AgendaList({
  query,
  items,
  empty,
  children,
}: {
  query: UseQueryResult<unknown>
  items: AgendaItem[]
  empty: string
  children: (items: AgendaItem[]) => ReactNode
}) {
  return (
    <QueryState query={query} loading={<Skeleton className="h-32 w-full" />}>
      {() =>
        items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          children(items)
        )
      }
    </QueryState>
  )
}

function Dates({ schedule, today }: { schedule: ScheduleSummary; today: LocalDate }) {
  const t = useTranslations("meetings.schedule")
  const can = useCanIn(meetingGroup(schedule))

  const next = useQuery(
    agendaQuery({ scheduleId: schedule.id, from: today, to: addDays(today, DAYS) })
  )

  const past = useQuery(
    agendaQuery({
      scheduleId: schedule.id,
      from: addDays(today, -DAYS - 1),
      to: addDays(today, -1),
    })
  )

  const upcoming = (next.data?.items ?? [])
    .filter((item) => item.kind === "planned" || item.status !== "completed")
    .slice(0, NEXT_DATES)

  const earlier = [
    ...(past.data?.items ?? []),
    ...(next.data?.items ?? []).filter(
      (item) => item.kind === "session" && item.date === today && item.status === "completed"
    ),
  ]
    .filter((item) => item.kind === "session")
    .reverse()
    .slice(0, PAST_SESSIONS)

  const rows = (items: AgendaItem[]) => (
    <ul className="divide-y border-y">
      {items.map((item) => (
        <li key={itemKey(item)} className="flex items-center gap-2">
          <AgendaRow
            item={item}
            today={today}
            href={item.kind === "planned" ? null : undefined}
            className="min-w-0 flex-1"
          />
          {item.kind === "planned" && can("update", "sessions") ? (
            <OccurrenceMenu item={item} />
          ) : null}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <Section id="next-dates" title={t("nextTitle")} description={t("nextDescription")}>
        {schedule.active ? (
          <AgendaList query={next} items={upcoming} empty={t("nextEmpty")}>
            {rows}
          </AgendaList>
        ) : (
          <p className="text-sm text-muted-foreground">{t("nextInactive")}</p>
        )}
      </Section>
      <Section id="past-sessions" title={t("pastTitle")}>
        <AgendaList query={past} items={earlier} empty={t("pastEmpty")}>
          {rows}
        </AgendaList>
      </Section>
    </div>
  )
}

function Facts({ schedule, today }: { schedule: ScheduleSummary; today: LocalDate }) {
  const t = useTranslations("meetings")
  const f = useFormat()

  const facts: [string, React.ReactNode][] = [
    [t("schedule.repeats"), f.recurrence(recurrenceOf(schedule.recurrence))],
    [t("schedule.time"), f.timeRange(schedule.startTime, schedule.endTime)],
    [t("fields.place"), schedule.location ? <bdi>{schedule.location}</bdi> : t("schedule.notSet")],
    [
      t("schedule.who"),
      schedule.rosterMode === "open"
        ? t("roster.open")
        : t("roster.ofGroup", { group: groupOf(schedule) }),
    ],
    [
      t("schedule.sessions"),
      `${schedule.generating ? t("schedule.generating") : t("schedule.notGenerating")} · ${t(
        "list.sessionsSoFar",
        { count: schedule.sessionCount }
      )}`,
    ],
    [t("schedule.created"), f.instantLabel(schedule.createdAt, today)],
    [t("schedule.updated"), f.instantLabel(schedule.updatedAt, today)],
  ]

  return (
    <aside className="flex min-w-0 flex-col gap-4 border p-5 lg:self-start">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        {facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {schedule.description ? (
        <p dir="auto" className="text-sm whitespace-pre-line text-muted-foreground">
          {schedule.description}
        </p>
      ) : null}
    </aside>
  )
}

function ScheduleView({ schedule, today }: { schedule: ScheduleSummary; today: LocalDate }) {
  const t = useTranslations()
  const f = useFormat()
  const archived = archivedPart(schedule)

  return (
    <>
      <Topbar
        crumbs={[
          { label: t("nav.meetings"), href: routes.meetings() },
          { label: t("meetings.tabs.schedules"), href: routes.schedules() },
          { label: schedule.name },
        ]}
      />
      <PageBody>
        <PageHeader
          meta={
            <>
              <ServiceTag service={schedule.service} />
              <span className="text-muted-foreground">· {groupOf(schedule)}</span>
            </>
          }
          title={schedule.name}
          description={
            <span className="inline-flex items-center gap-1.5">
              <Repeat className="size-3.5" aria-hidden="true" />
              {t("meetings.schedule.when", {
                pattern: f.recurrence(recurrenceOf(schedule.recurrence)),
                time: f.timeRange(schedule.startTime, schedule.endTime),
              })}
            </span>
          }
          actions={<Actions schedule={schedule} today={today} />}
        />
        {schedule.active ? null : (
          <p className="border border-dashed p-4 text-sm text-muted-foreground">
            {t("meetings.schedule.inactiveNote")}
            {archived ? (
              <>
                {" "}
                {archived.kind === "service"
                  ? t("meetings.schedule.restoreService", { name: archived.name })
                  : t("meetings.schedule.restoreStage", { name: archived.name })}
              </>
            ) : null}
          </p>
        )}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <Dates schedule={schedule} today={today} />
          <Facts schedule={schedule} today={today} />
        </div>
      </PageBody>
    </>
  )
}

function Schedule({ id }: { id: string }) {
  const query = useQuery(scheduleQuery(id))

  return (
    <QueryState
      query={query}
      notFound={<RecordNotFound area="meetings" home={routes.schedules()} />}
    >
      {(data) => <ScheduleView schedule={data.schedule} today={data.today} />}
    </QueryState>
  )
}

export function SchedulePage() {
  return (
    <RecordPage notFound={<RecordNotFound area="meetings" home={routes.schedules()} />}>
      {(id) => <Schedule id={id} />}
    </RecordPage>
  )
}
