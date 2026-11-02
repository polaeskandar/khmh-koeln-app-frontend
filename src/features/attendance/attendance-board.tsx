"use client"

import { cn } from "cn"
import { Check, Search, Undo2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ReactNode, useState } from "react"

import { MemberAvatar } from "@/components/member-avatar"
import { RosterCells } from "@/components/roster-cells"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFormat } from "@/i18n/format"
import type { PersonRef } from "@/lib/api/types/common"
import { fullName, initials, matchesQuery, preferredName } from "@/lib/domain/names"

import type { AttendanceBoard as Board, Mark, Placement } from "./api"

type Filter = "all" | "open" | "present"

export type BoardActions = {
  onMark?: (person: PersonRef) => void
  onUndo?: (person: PersonRef, mark: Mark) => void
  onClose?: () => void
  pending?: ReadonlySet<string>
}

const placementText = (placements: Placement[]) =>
  placements.map((p) => p.stage?.name ?? p.service.name).join(" · ")

function PersonRow({
  person,
  mark,
  placements,
  canRecord,
  actions,
}: {
  person: PersonRef
  mark: Mark | null
  placements?: Placement[]
  canRecord: boolean
  actions: BoardActions
}) {
  const t = useTranslations("attendance.board")
  const f = useFormat()
  const name = preferredName(person)

  const detail = placements
    ? placementText(placements) || t("noGroup")
    : person.displayName
      ? fullName(person)
      : null

  return (
    <li className={cn("flex items-center gap-3 py-2.5", mark && "bg-success-soft/40")}>
      <MemberAvatar name={name} initials={initials(person)} seed={person.id} className="ms-1" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{name}</span>
        {detail ? <span className="truncate text-xs text-muted-foreground">{detail}</span> : null}
      </span>
      {mark ? (
        <span className="flex shrink-0 items-center gap-1">
          <span className="inline-flex h-10 items-center gap-1.5 px-2 text-sm font-medium text-success">
            <Check className="size-4" aria-hidden="true" />
            <span>
              {t("present")}
              <span className="hidden sm:inline"> · {f.instantTime(mark.recordedAt)}</span>
            </span>
          </span>
          {canRecord ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("undo", { name })}
              disabled={!actions.onUndo || actions.pending?.has(person.id)}
              onClick={() => actions.onUndo?.(person, mark)}
            >
              <Undo2 />
            </Button>
          ) : null}
        </span>
      ) : canRecord ? (
        <Button
          variant="outline"
          className="h-10 w-32 shrink-0"
          aria-label={t("mark", { name })}
          disabled={!actions.onMark || actions.pending?.has(person.id)}
          onClick={() => actions.onMark?.(person)}
        >
          {t("present")}
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">{t("notMarked")}</span>
      )}
    </li>
  )
}

export function AttendanceBoard({
  board,
  actions = {},
  children,
}: {
  board: Board
  actions?: BoardActions
  children?: ReactNode
}) {
  const t = useTranslations("attendance.board")
  const tc = useTranslations("common")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const { session, counts } = board
  const canRecord = session.can.record
  const expected = session.rosterMode === "expected"
  const rosterSize = board.roster.length
  const notMarked = rosterSize - counts.rosterPresent
  const q = query.trim()
  const shown = (person: PersonRef) => q === "" || matchesQuery(person, q)

  const roster = board.roster.filter(
    (row) =>
      shown(row.person) &&
      (filter === "all" || (filter === "present" ? row.mark !== null : row.mark === null))
  )

  const others = board.notOnRoster.filter((row) => shown(row.person) && filter !== "open")

  const num = (chunks: ReactNode) => (
    <span className="font-heading text-3xl font-semibold text-foreground tabular-nums">
      {chunks}
    </span>
  )

  const counter = (
    <span className="text-sm text-muted-foreground">
      {expected
        ? t.rich("counter", { present: counts.rosterPresent, total: rosterSize, num })
        : t.rich("counterOpen", { count: counts.present, num })}
      {expected && counts.notOnRoster
        ? ` · ${t("notOnRoster", { count: counts.notOnRoster })}`
        : null}
    </span>
  )

  return (
    <div className="grid gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:pb-0">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="sticky top-14 z-10 -mx-4 flex flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t("find")}
              placeholder={expected ? t("findOnRoster") : t("find")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label={tc("clearSearch")}
                  onClick={() => setQuery("")}
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
          {expected ? (
            <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="all">{t("tabAll", { count: rosterSize })}</TabsTrigger>
                <TabsTrigger value="open">{t("tabOpen", { count: notMarked })}</TabsTrigger>
                <TabsTrigger value="present">
                  {t("tabPresent", { count: counts.rosterPresent })}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
        </div>

        {expected ? (
          <section aria-label={t("roster")}>
            {roster.length === 0 ? (
              <p className="border border-dashed p-4 text-sm text-muted-foreground">
                {q ? t("noRosterMatch") : filter === "open" ? t("everyoneMarked") : t("nobodyYet")}
              </p>
            ) : (
              <ul className="divide-y border-y">
                {roster.map((row) => (
                  <PersonRow
                    key={row.person.id}
                    person={row.person}
                    mark={row.mark}
                    canRecord={canRecord}
                    actions={actions}
                  />
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {others.length > 0 ? (
          <section
            className="flex flex-col gap-2"
            aria-label={expected ? t("presentNotOnRoster") : t("presentList")}
          >
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {expected ? t("presentNotOnRoster") : t("presentList")}
            </h2>
            <ul className="divide-y border-y">
              {others.map((row) => (
                <PersonRow
                  key={row.person.id}
                  person={row.person}
                  mark={row.mark}
                  placements={row.placements}
                  canRecord={canRecord}
                  actions={actions}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {children}
      </div>

      <aside className="hidden min-w-0 flex-col gap-5 self-start lg:sticky lg:top-20 lg:flex">
        <div className="flex flex-col gap-3 border p-5" data-testid="counter-panel">
          <p>{counter}</p>
          {expected && rosterSize > 0 ? (
            <RosterCells
              filled={counts.rosterPresent}
              total={rosterSize}
              extra={counts.notOnRoster}
              size="md"
            />
          ) : null}
          {expected ? (
            <p className="text-sm text-muted-foreground">
              {notMarked === 0 ? t("everyoneMarked") : t("notMarkedYet", { count: notMarked })}
            </p>
          ) : null}
          {canRecord ? (
            <Button onClick={actions.onClose} disabled={!actions.onClose}>
              {t("close")}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">{t("viewOnly")}</p>
          )}
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <p className="flex-1 leading-tight">{counter}</p>
        {canRecord ? (
          <Button onClick={actions.onClose} disabled={!actions.onClose}>
            {t("closeShort")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
