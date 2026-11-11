"use client"

import { useTranslations } from "next-intl"
import { useReducer } from "react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api/problem"
import { isStale, useRefetch } from "@/lib/api/refetch"
import type { PersonRef, Uuid } from "@/lib/api/types/common"
import { translateProblem } from "@/lib/api/translate-problem"
import { useProblemTranslator } from "@/lib/api/use-problem-translator"

import { meetingSessionQuery } from "../meetings/api"
import {
  type AttendanceBoard,
  MARK_QUERIES,
  type Mark,
  type Placement,
  recordMarkRequest,
  removeMarkRequest,
} from "./api"

export type Visitor = { person: PersonRef; placements: Placement[] }

type Write = {
  present: boolean
  status: "pending" | "confirmed"
  mark: Mark | null
  settledAt: number
  confirmed: Write | null
  visitor?: Visitor
}

export type Writes = Readonly<Record<Uuid, Write>>

export type WriteAction =
  | { type: "start"; personId: Uuid; present: boolean; visitor?: Visitor }
  | { type: "confirm"; personId: Uuid; mark: Mark | null; at: number }
  | { type: "fail"; personId: Uuid }

export function writesReducer(writes: Writes, action: WriteAction): Writes {
  const current = writes[action.personId]

  switch (action.type) {
    case "start":
      if (current?.status === "pending") {
        return writes
      }

      return {
        ...writes,
        [action.personId]: {
          present: action.present,
          status: "pending",
          mark: null,
          settledAt: 0,
          confirmed: current?.status === "confirmed" ? current : null,
          visitor: action.visitor,
        },
      }
    case "confirm":
      if (!current) {
        return writes
      }

      return {
        ...writes,
        [action.personId]: {
          ...current,
          status: "confirmed",
          mark: action.mark,
          settledAt: action.at,
          confirmed: null,
        },
      }
    case "fail": {
      const rest = { ...writes }
      delete rest[action.personId]

      return current?.confirmed ? { ...rest, [action.personId]: current.confirmed } : rest
    }
  }
}

const PENDING_MARK: Mark = { id: "", recordedAt: "" }

export function applyWrites<Board extends AttendanceBoard>(
  board: Board,
  writes: Writes,
  boardAt: number
): Board {
  const live = (personId: Uuid) => {
    const write = writes[personId]

    return write && (write.status === "pending" || write.settledAt > boardAt) ? write : null
  }

  const markOf = (personId: Uuid, mark: Mark | null) => {
    const write = live(personId)

    if (!write) {
      return mark
    }

    return write.present ? (write.mark ?? mark ?? PENDING_MARK) : null
  }

  const roster = board.roster.map((row) => ({ ...row, mark: markOf(row.person.id, row.mark) }))

  const notOnRoster = board.notOnRoster.flatMap((row) => {
    const mark = markOf(row.person.id, row.mark)

    return mark ? [{ ...row, mark }] : []
  })

  const listed = new Set([...board.roster, ...board.notOnRoster].map((row) => row.person.id))

  for (const write of Object.values(writes)) {
    if (!write.visitor || listed.has(write.visitor.person.id)) {
      continue
    }

    const mark = markOf(write.visitor.person.id, null)

    if (mark) {
      notOnRoster.push({ ...write.visitor, mark })
    }
  }

  const rosterPresent = roster.filter((row) => row.mark).length

  return {
    ...board,
    roster,
    notOnRoster,
    counts: {
      ...board.counts,
      present: rosterPresent + notOnRoster.length,
      rosterPresent,
      notMarked: board.counts.rosterSize === null ? 0 : roster.length - rosterPresent,
      notOnRoster: notOnRoster.length,
    },
  }
}

const ATTEMPTS = 3
const TIMEOUT_MS = 10_000
const BACKOFF_MS = 500

const CHANGED_MEANWHILE = [
  "attendance.closedReopen",
  "attendance.openFirst",
  "meetings.sessionCanceled",
  "notFound.person",
]

const retryable = (error: unknown) =>
  !(error instanceof ApiError) || error.status === 0 || error.status >= 500

async function withRetries<T>(write: (signal: AbortSignal) => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await write(AbortSignal.timeout(TIMEOUT_MS))
    } catch (error) {
      if (!retryable(error) || attempt === ATTEMPTS) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS * 2 ** (attempt - 1)))
    }
  }
}

export function useMarkWrites(sessionId: Uuid) {
  const t = useTranslations()
  const translate = useProblemTranslator()
  const refetch = useRefetch()
  const [writes, dispatch] = useReducer(writesReducer, {})

  async function send(person: PersonRef, present: boolean, visitor?: Visitor) {
    dispatch({ type: "start", personId: person.id, present, visitor })

    try {
      const saved = await withRetries((signal) =>
        present
          ? recordMarkRequest(sessionId, person.id, signal)
          : removeMarkRequest(sessionId, person.id, null, signal)
      )

      dispatch({
        type: "confirm",
        personId: person.id,
        mark: saved ? { id: saved.id, recordedAt: saved.recordedAt } : null,
        at: Date.now(),
      })

      void refetch(MARK_QUERIES)
    } catch (error) {
      dispatch({ type: "fail", personId: person.id })

      if (!(error instanceof ApiError) || retryable(error)) {
        toast.error(t("errors.notSaved"), {
          action: { label: t("common.retry"), onClick: () => void send(person, present, visitor) },
        })

        return
      }

      toast.error(translateProblem(error, translate))

      if (isStale(error, CHANGED_MEANWHILE)) {
        void refetch([...MARK_QUERIES, meetingSessionQuery(sessionId).queryKey])
      }
    }
  }

  const pending = new Set(
    Object.entries(writes)
      .filter(([, write]) => write.status === "pending")
      .map(([personId]) => personId)
  )

  return {
    writes,
    pending,
    mark: (person: PersonRef) => {
      if (!pending.has(person.id)) {
        void send(person, true)
      }
    },
    markVisitor: (visitor: Visitor) => {
      if (!pending.has(visitor.person.id)) {
        void send(visitor.person, true, visitor)
      }
    },
    undo: (person: PersonRef) => {
      if (!pending.has(person.id)) {
        void send(person, false)
      }
    },
  }
}
