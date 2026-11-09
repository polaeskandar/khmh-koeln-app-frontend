"use client"

import { useQuery } from "@tanstack/react-query"
import { UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { directoryQuery } from "@/features/people/members/api"
import { isolate } from "@/lib/bidi"

import type { AttendanceBoard } from "./api"
import { PersonRow } from "./attendance-board"
import { useOnline, type Visitor } from "./mark-writes"

const MIN_LETTERS = 2
const MAX_RESULTS = 8
const DEBOUNCE_MS = 250

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms)

    return () => clearTimeout(timer)
  }, [value, ms])

  return debounced
}

export function VisitorSearch({
  board,
  query,
  pending,
  onMark,
}: {
  board: AttendanceBoard
  query: string
  pending: ReadonlySet<string>
  onMark: (visitor: Visitor) => void
}) {
  const t = useTranslations()
  const online = useOnline()
  const q = useDebounced(query, DEBOUNCE_MS)
  const ready = q.length >= MIN_LETTERS && query.length >= MIN_LETTERS
  const results = useQuery({ ...directoryQuery(q), enabled: ready && online })
  const expected = board.session.rosterMode === "expected"
  const listed = new Set([...board.roster, ...board.notOnRoster].map((row) => row.person.id))

  const found = (results.data?.items ?? [])
    .filter((person) => !listed.has(person.id) && !pending.has(person.id))
    .slice(0, MAX_RESULTS)

  const content = () => {
    if (query.length < MIN_LETTERS) {
      return <p className="text-sm text-muted-foreground">{t("attendance.board.typeTwoLetters")}</p>
    }

    if (!online) {
      return <p className="text-sm text-muted-foreground">{t("errors.network")}</p>
    }

    if (results.isError) {
      return <p className="text-sm text-muted-foreground">{t("errors.loadFailed")}</p>
    }

    if (!ready || results.isPending) {
      return null
    }

    if (found.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          {t("attendance.board.noOtherMatch", { query: isolate(q) })}
        </p>
      )
    }

    return (
      <ul className="divide-y border-y">
        {found.map(({ groups, ...person }) => (
          <PersonRow
            key={person.id}
            person={person}
            mark={null}
            placements={groups}
            canRecord
            actions={{ onMark: () => onMark({ person, placements: groups }) }}
          />
        ))}
      </ul>
    )
  }

  return (
    <section className="flex flex-col gap-2" aria-label={t("attendance.board.addSomeone")}>
      <h2 className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        <UserPlus className="size-3.5" aria-hidden="true" />
        {expected ? t("attendance.board.someoneNotOnRoster") : t("attendance.board.markSomeone")}
      </h2>
      {content()}
    </section>
  )
}
