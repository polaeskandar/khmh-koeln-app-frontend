"use client"

import { useTranslations } from "next-intl"
import { type ReactNode, useState } from "react"

import { useCanIn } from "@/features/identity/auth/session"
import type { PersonReference } from "@/features/people/members/api"
import { matchesQuery } from "@/lib/domain/names"
import { meetingGroup } from "@/lib/permissions"

import type { AttendanceSheet } from "./api"
import { CounterPanel, MobileCounterBar, tallyOf } from "./board-counter"
import { Corrections, RecentlyMarked } from "./board-history"
import { BoardSearch, type Filter, passesFilter } from "./board-search"
import { type BoardActions, PersonRow } from "./person-row"

export function AttendanceBoard({
  sheet,
  actions = {},
  below,
}: {
  sheet: AttendanceSheet
  actions?: BoardActions
  below?: (searchText: string) => ReactNode
}) {
  const t = useTranslations("attendance.board")
  const can = useCanIn(meetingGroup(sheet.session))
  const [searchText, setSearchText] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const canRecord = can("create", "attendance")
  const canRemove = can("delete", "attendance")
  const { expected } = tallyOf(sheet)
  const q = searchText.trim()
  const shown = (person: PersonReference) => q === "" || matchesQuery(person, q)
  const roster = sheet.roster.filter((row) => shown(row.person) && passesFilter(filter, row.mark))
  const others = sheet.notOnRoster.filter((row) => shown(row.person) && filter !== "open")

  const emptyRoster = () => {
    if (q) {
      return t("noRosterMatch")
    }

    return filter === "open" ? t("everyoneMarked") : t("nobodyYet")
  }

  return (
    <div className="grid gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:pb-0">
      <div className="flex min-w-0 flex-col gap-4">
        <BoardSearch
          sheet={sheet}
          searchText={searchText}
          onSearchTextChange={setSearchText}
          filter={filter}
          onFilterChange={setFilter}
        />

        {expected ? (
          <section aria-label={t("roster")}>
            {roster.length === 0 ? (
              <p className="border border-dashed p-4 text-sm text-muted-foreground">
                {emptyRoster()}
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
        <CounterPanel sheet={sheet} canRecord={canRecord} actions={actions} />
        <RecentlyMarked sheet={sheet} onCorrect={canRemove ? actions.onCorrect : undefined} />
        <Corrections sheet={sheet} />
      </aside>

      <MobileCounterBar sheet={sheet} canRecord={canRecord} actions={actions} />
    </div>
  )
}
