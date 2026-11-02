"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Plus, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Stage } from "@/features/stages/api"
import { StageLayout } from "@/features/stages/stage-layout"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import type { LessonStatus } from "@/lib/api/types/learning"
import { routes } from "@/lib/routes"

import { type LessonRow, type LessonTab, type StageLessons, stageLessonsQuery } from "./api"
import { LessonStatusBadge, MeetingLine } from "./lesson-bits"

const SEARCH_DELAY_MS = 300
const STATUSES: LessonStatus[] = ["draft", "ready", "completed"]

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms)

    return () => clearTimeout(timer)
  }, [value, ms])

  return debounced
}

function Row({ lesson, today }: { lesson: LessonRow; today: string }) {
  const t = useTranslations()
  const f = useFormat()
  const { total, drafts } = lesson.homework

  return (
    <li>
      <Link
        href={routes.lesson(lesson.id)}
        className="-mx-2 flex min-w-0 items-start gap-4 px-2 py-3 hover:bg-muted/60"
      >
        <div className="w-14 shrink-0 text-center leading-none">
          <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            {f.todayOrWeekday(lesson.teachingDate, today)}
          </div>
          <div className="mt-1 font-heading text-xl font-semibold tabular-nums">
            {f.dayOfMonth(lesson.teachingDate)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {f.monthShort(lesson.teachingDate)}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span dir="auto" className="font-medium">
              {lesson.title}
            </span>
            <LessonStatusBadge status={lesson.status} />
          </span>
          {lesson.passage ? (
            <span dir="auto" className="text-sm text-muted-foreground">
              {lesson.passage}
            </span>
          ) : null}
          <MeetingLine meeting={lesson.meeting} today={today} />
          <span className="text-xs text-muted-foreground">
            {[
              lesson.responsible?.name ?? t("common.formerAccount"),
              total > 0
                ? [
                    t("counts.homework", { count: total }),
                    drafts > 0 ? t("lessons.list.drafts", { count: drafts }) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      </Link>
    </li>
  )
}

function LessonList({
  data,
  tab,
  status,
  servant,
  filtered,
  onClear,
}: {
  data: StageLessons
  tab: LessonTab
  status: string
  servant: string
  filtered: boolean
  onClear: () => void
}) {
  const t = useTranslations("lessons.list")

  const rows = data.items.filter(
    (lesson) =>
      (!status || lesson.status === status) && (!servant || lesson.responsible?.id === servant)
  )

  if (rows.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>
            {filtered
              ? t("noMatch")
              : tab === "upcoming"
                ? t("noUpcoming")
                : tab === "previous"
                  ? t("noPrevious")
                  : t("noArchived")}
          </EmptyTitle>
          <EmptyDescription>
            {filtered
              ? t("noMatchHint")
              : tab === "upcoming"
                ? t("noUpcomingHint")
                : tab === "previous"
                  ? t("noPreviousHint")
                  : null}
          </EmptyDescription>
        </EmptyHeader>
        {filtered ? (
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={onClear}>
              {t("clearFilters")}
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    )
  }

  return (
    <ul className="divide-y border-y">
      {rows.map((lesson) => (
        <Row key={lesson.id} lesson={lesson} today={data.today} />
      ))}
    </ul>
  )
}

function Lessons({ stage }: { stage: Stage }) {
  const t = useTranslations()
  const [tab, setTab] = useState<LessonTab>("upcoming")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [servant, setServant] = useState("")
  const q = useDebounced(search.trim(), SEARCH_DELAY_MS)

  const query = useQuery({
    ...stageLessonsQuery(stage.id, tab, q),
    placeholderData: keepPreviousData,
  })

  const filtered = q !== "" || status !== "" || servant !== ""

  const clear = () => {
    setSearch("")
    setStatus("")
    setServant("")
  }

  const data = query.data

  const tabs: LessonTab[] =
    data && data.tabs.archived > 0 ? ["upcoming", "previous", "archived"] : ["upcoming", "previous"]

  return (
    <Section
      id="lessons"
      title={t("lessons.list.sectionTitle")}
      description={t("lessons.list.sectionDescription")}
      actions={
        data?.can.create ? (
          <Button asChild>
            <Link href={routes.newLesson(stage.id)}>
              <Plus data-icon="inline-start" />
              {t("lessons.newLesson")}
            </Link>
          </Button>
        ) : null
      }
    >
      {data && !data.can.create ? (
        <p className="text-sm text-muted-foreground">{t("lessons.list.onlyServants")}</p>
      ) : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(value as LessonTab)}>
          <TabsList>
            {tabs.map((key) => (
              <TabsTrigger key={key} value={key}>
                {t(`lessons.list.${key}`, { count: data?.tabs[key] ?? 0 })}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row">
          <InputGroup className="w-full sm:w-56">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t("lessons.list.search")}
              placeholder={t("lessons.list.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </InputGroup>
          <NativeSelect
            aria-label={t("lessons.fields.status")}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <NativeSelectOption value="">{t("lessons.list.anyStatus")}</NativeSelectOption>
            {STATUSES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {t(`lessons.status.${value}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label={t("lessons.list.servant")}
            value={servant}
            onChange={(event) => setServant(event.target.value)}
          >
            <NativeSelectOption value="">{t("lessons.list.anyServant")}</NativeSelectOption>
            {data?.servants.map((person) => (
              <NativeSelectOption key={person.id} value={person.id}>
                {person.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
      <QueryState query={query}>
        {(loaded) => (
          <LessonList
            data={loaded}
            tab={tab}
            status={status}
            servant={servant}
            filtered={filtered}
            onClear={clear}
          />
        )}
      </QueryState>
    </Section>
  )
}

export function StageLessonsPage() {
  return <StageLayout tab="lessons">{(stage) => <Lessons stage={stage} />}</StageLayout>
}
