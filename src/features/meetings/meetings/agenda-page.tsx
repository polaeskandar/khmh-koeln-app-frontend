"use client"

import { CalendarOff, ChevronLeft, ChevronRight } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { type ReactNode, Suspense } from "react"
import { useQuery } from "@tanstack/react-query"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { NotAssigned } from "@/components/not-assigned"
import { QueryState } from "@/components/page-states"
import { AgendaRow } from "./agenda-row"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useCan, useUnassigned } from "@/features/identity/auth/session"
import { servicesQuery } from "@/features/organization/services/api"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import type { LocalDate } from "@/lib/api/types/common"
import type { AgendaItem } from "@/lib/api/types/meetings"
import { compareAgenda } from "./agenda-order"
import { addDays, datesBetween, isValidLocalDate } from "@/lib/domain/time"
import { meetingGroup } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { type Agenda, agendaQuery } from "./api"
import { DayStrip } from "./day-strip"
import { MeetingsTabs, ServiceFilter, withQuery } from "./meetings-nav"
import { OccurrenceMenu } from "./occurrence-menu"

const WINDOW_DAYS = 14

const validDate = (value: string | null) => (value && isValidLocalDate(value) ? value : null)

const itemKey = (item: AgendaItem) =>
  item.kind === "session" ? item.id : `${item.scheduleId}:${item.date}`

function useDaySummary() {
  const t = useTranslations("meetings.agenda")

  return (items: AgendaItem[]) => {
    if (items.length === 0) {
      return t("none")
    }

    const sessions = items.filter((item) => item.kind === "session")
    const open = sessions.filter((item) => item.status === "active").length
    const canceled = sessions.filter((item) => item.status === "canceled").length
    const planned = items.length - sessions.length

    return [
      t("count", { count: items.length }),
      open ? t("open", { count: open }) : null,
      canceled ? t("canceled", { count: canceled }) : null,
      planned ? t("planned", { count: planned }) : null,
    ]
      .filter(Boolean)
      .join(" · ")
  }
}

function AgendaView({
  agenda,
  requestedDate,
  serviceId,
  windowStart,
}: {
  agenda: Agenda
  requestedDate: LocalDate | null
  serviceId: string | null
  windowStart: LocalDate | null
}) {
  const t = useTranslations("meetings.agenda")
  const f = useFormat()
  const can = useCan()
  const summary = useDaySummary()
  const dates = datesBetween(agenda.from, agenda.to)
  const inWindow = (date: LocalDate | null) => date !== null && dates.includes(date)

  const selected = inWindow(requestedDate)
    ? requestedDate!
    : inWindow(agenda.today)
      ? agenda.today
      : agenda.from

  const dayHref = (date: LocalDate) =>
    withQuery(routes.meetings(), {
      from: windowStart,
      date: date === agenda.today ? null : date,
      service: serviceId,
    })

  const shiftHref = (days: number) =>
    withQuery(routes.meetings(), {
      from: addDays(agenda.from, days),
      date: requestedDate ? addDays(requestedDate, days) : null,
      service: serviceId,
    })

  const days = dates.map((date) => {
    const items = agenda.items.filter((item) => item.date === date)

    return {
      date,
      items: [...items].sort(compareAgenda),
      count: items.length,
      tones: items
        .filter((item) => item.kind === "planned" || item.status !== "canceled")
        .flatMap((item) => (item.service ? [item.service.tone] : [])),
    }
  })

  const day = days.find((d) => d.date === selected)!

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {t("range", {
              from: f.longDate(agenda.from).replace(/ \d{4}$/, ""),
              to: f.longDate(agenda.to),
            })}
          </p>
          <span className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={shiftHref(-WINDOW_DAYS)}>
                <ChevronLeft data-icon="inline-start" />
                {t("earlier")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={shiftHref(WINDOW_DAYS)}>
                {t("later")}
                <ChevronRight data-icon="inline-end" />
              </Link>
            </Button>
          </span>
        </div>
        <DayStrip
          days={days.map(({ date, tones, count }) => ({ date, tones, count }))}
          selected={selected}
          today={agenda.today}
          href={dayHref}
        />
      </div>
      <Section id="day" title={f.longDate(selected)} description={summary(day.items)}>
        {day.items.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarOff />
              </EmptyMedia>
              <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
              <EmptyDescription>
                {serviceId ? t("emptyFiltered") : t("emptyOtherDay")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y border-y">
            {day.items.map((item) => (
              <li key={itemKey(item)} className="flex items-center gap-2">
                <AgendaRow item={item} today={agenda.today} className="min-w-0 flex-1" />
                {item.kind === "planned" && can("update", "sessions", meetingGroup(item)) ? (
                  <OccurrenceMenu item={item} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}

function AgendaScreen({ actions }: { actions?: ReactNode }) {
  const t = useTranslations()
  const unassigned = useUnassigned()
  const search = useSearchParams()
  const windowStart = validDate(search.get("from"))
  const requestedDate = validDate(search.get("date"))
  const serviceId = search.get("service")

  const agenda = useQuery(
    agendaQuery({
      ...(windowStart ? { from: windowStart, to: addDays(windowStart, WINDOW_DAYS - 1) } : {}),
      ...(serviceId ? { serviceId } : {}),
    })
  )

  const services = useQuery(servicesQuery)
  const active = services.data?.items.filter((service) => !service.archived) ?? []

  return (
    <>
      <Topbar crumbs={[{ label: t("nav.meetings") }]} />
      <PageBody>
        <PageHeader
          title={t("nav.meetings")}
          description={t("meetings.agenda.description")}
          actions={actions}
        />
        {unassigned ? (
          <NotAssigned />
        ) : (
          <>
            <MeetingsTabs active="sessions" />
            <div className="flex justify-end">
              <ServiceFilter
                services={active}
                value={serviceId}
                path={routes.meetings()}
                query={{ from: windowStart, date: requestedDate }}
              />
            </div>
            <QueryState query={agenda}>
              {(data) => (
                <AgendaView
                  agenda={data}
                  requestedDate={requestedDate}
                  serviceId={serviceId}
                  windowStart={windowStart}
                />
              )}
            </QueryState>
          </>
        )}
      </PageBody>
    </>
  )
}

export function AgendaPage({ actions }: { actions?: ReactNode }) {
  return (
    <Suspense>
      <AgendaScreen actions={actions} />
    </Suspense>
  )
}
