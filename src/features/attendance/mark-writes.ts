"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useCallback, useReducer, useSyncExternalStore } from "react"
import { toast } from "sonner"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import { ApiError } from "@/lib/api/problem"
import type { PersonRef, Uuid } from "@/lib/api/types/common"
import { type ProblemTranslator, translateProblem } from "@/lib/api/translate-problem"

import type { AttendanceBoard, Mark } from "./api"

export type Write = {
  present: boolean
  status: "pending" | "confirmed"
  mark: Mark | null
  settledAt: number
}

export type Writes = Readonly<Record<Uuid, Write>>

export type WriteAction =
  | { type: "start"; personId: Uuid; present: boolean }
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
        [action.personId]: { present: action.present, status: "pending", mark: null, settledAt: 0 },
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
        },
      }
    case "fail": {
      const rest = { ...writes }
      delete rest[action.personId]

      return rest
    }
  }
}

const PENDING_MARK: Mark = { id: "", recordedAt: "", recordedBy: null }

export function applyWrites(
  board: AttendanceBoard,
  writes: Writes,
  boardAt: number
): AttendanceBoard {
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

const REFETCH_CODES = new Set([
  "attendance.closedReopen",
  "attendance.openFirst",
  "meetings.sessionCanceled",
  "notFound.person",
])

const retryable = (error: unknown) =>
  !(error instanceof ApiError) || error.status === 0 || error.status >= 500

export async function withRetries<T>(write: (signal: AbortSignal) => Promise<T>): Promise<T> {
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
  const queryClient = useQueryClient()
  const [writes, dispatch] = useReducer(writesReducer, {})

  const refetchBoard = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
    [queryClient]
  )

  async function send(person: PersonRef, present: boolean) {
    dispatch({ type: "start", personId: person.id, present })
    const params = { path: { sessionId, personId: person.id } }

    try {
      const saved = await withRetries<Schemas["MarkView"] | void>((signal) =>
        present
          ? dataOf(
              api.PUT("/sessions/{sessionId}/attendance/{personId}", { params, body: {}, signal })
            )
          : dataOf(
              api.DELETE("/sessions/{sessionId}/attendance/{personId}", {
                params,
                body: {},
                signal,
              })
            )
      )

      dispatch({
        type: "confirm",
        personId: person.id,
        mark: saved
          ? { id: saved.id, recordedAt: saved.recordedAt, recordedBy: saved.recordedBy }
          : null,
        at: Date.now(),
      })

      void refetchBoard()
    } catch (error) {
      dispatch({ type: "fail", personId: person.id })

      if (retryable(error)) {
        toast.error(t("errors.notSaved"), {
          action: { label: t("common.retry"), onClick: () => void send(person, present) },
        })

        return
      }

      const problem = error as ApiError
      toast.error(translateProblem(problem, t as unknown as ProblemTranslator))

      if (problem.code && REFETCH_CODES.has(problem.code)) {
        void refetchBoard()
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
    undo: (person: PersonRef) => {
      if (!pending.has(person.id)) {
        void send(person, false)
      }
    },
  }
}

const subscribeOnline = (onChange: () => void) => {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)

  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

export const useOnline = () =>
  useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  )
