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
import { useCanIn } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { isolate } from "@/lib/bidi"
import type { PersonRef } from "@/lib/api/types/common"
import { fullName, initials, matchesQuery, preferredName } from "@/lib/domain/names"
import { oneOf } from "@/lib/one-of"
import { meetingGroup } from "@/lib/permissions"

import type { AttendanceSheet as Board, Mark, Placement } from "./api"

type Filter = "all" | "open" | "present"

const FILTERS: Filter[] = ["all", "open", "present"]

export type BoardActions = {
  onMark?: (person: PersonRef) => void
  onUndo?: (person: PersonRef, mark: Mark) => void
  onClose?: () => void
  onCorrect?: () => void
  pending?: ReadonlySet<string>
  saving?: boolean
}

const placementText = (placements: Placement[]) =>
  placements
    .map((p) => (p.stage ? `${p.service.name} · ${p.stage.name}` : p.service.name))
    .join(", ")

export function PersonRow({
  person,
  mark,
  placements,
  canRecord,
  canRemove = false,
  actions,
}: {
  person: PersonRef
  mark: Mark | null
  placements?: Placement[]
  canRecord: boolean
  canRemove?: boolean
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
              {mark.recordedAt ? (
                <span className="hidden sm:inline"> · {f.instantTime(mark.recordedAt)}</span>
              ) : null}
            </span>
          </span>
          {canRemove ? (
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

function RecentlyMarked({ board, onCorrect }: { board: Board; onCorrect?: () => void }) {
  const t = useTranslations("attendance.board")
  const f = useFormat()

  if (board.recentlyMarked.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-2" aria-label={t("recent")}>
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("recent")}
      </h2>
      <ul className="flex flex-col gap-1.5 text-sm">
        {board.recentlyMarked
          .flatMap(({ person, mark }) => (mark ? [{ person, mark }] : []))
          .slice(0, 6)
          .map(({ person, mark }) => (
            <li key={mark.id} className="flex items-center justify-between gap-3">
              <span className="truncate">{preferredName(person)}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {f.instantTime(mark.recordedAt)}
              </span>
            </li>
          ))}
      </ul>
      {onCorrect ? (
        <button
          type="button"
          className="self-start text-xs text-muted-foreground underline underline-offset-4"
          onClick={onCorrect}
        >
          {t("correctMistake")}
        </button>
      ) : null}
    </section>
  )
}

function Corrections({ board }: { board: Board }) {
  const t = useTranslations("attendance.board")
  const f = useFormat()

  if (board.corrections.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-2" aria-label={t("corrections")}>
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("corrections")}
      </h2>
      <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {board.corrections
          .slice(-4)
          .reverse()
          .map((correction) => {
            if (!correction.removed.at) {
              return null
            }

            const removal = {
              name: preferredName(correction.person),
              when: f.atLabel(correction.removed.at, board.today),
            }

            return (
              <li key={correction.id}>
                {correction.reason
                  ? t("removedReason", { ...removal, reason: isolate(correction.reason) })
                  : t("removed", removal)}
              </li>
            )
          })}
      </ul>
    </section>
  )
}

export function AttendanceBoard({
  board,
  actions = {},
  below,
}: {
  board: Board
  actions?: BoardActions
  below?: (query: string) => ReactNode
}) {
  const t = useTranslations("attendance.board")
  const tc = useTranslations("common")
  const can = useCanIn(meetingGroup(board.session))
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const { session, counts } = board
  const canRecord = can("create", "attendance")
  const canRemove = can("delete", "attendance")
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
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(oneOf(FILTERS, value) ?? filter)}
            >
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
                    canRemove={canRemove}
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
                  canRemove={canRemove}
                  actions={actions}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {below?.(q)}
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
            <>
              <Button onClick={actions.onClose} disabled={!actions.onClose || actions.saving}>
                {t("close")}
              </Button>
              {actions.saving ? (
                <p role="status" className="text-xs text-muted-foreground">
                  {t("saving")}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">{t("viewOnly")}</p>
          )}
        </div>
        <RecentlyMarked board={board} onCorrect={canRemove ? actions.onCorrect : undefined} />
        <Corrections board={board} />
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <p className="flex-1 leading-tight">{counter}</p>
        {canRecord ? (
          <Button onClick={actions.onClose} disabled={!actions.onClose || actions.saving}>
            {t("closeShort")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
