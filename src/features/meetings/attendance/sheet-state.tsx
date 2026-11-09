"use client"

import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { QueryState } from "@/components/page-states"
import type { Uuid } from "@/lib/api/types/common"

import { meetingSessionQuery } from "../meetings/api"
import {
  type AttendanceSheet,
  attendanceBoardQuery,
  attendanceCorrectionsQuery,
  sheetOf,
} from "./api"

const LIVE = { refetchInterval: 30_000, refetchOnWindowFocus: true, refetchOnReconnect: true }

export function SheetState({
  id,
  live = false,
  notFound,
  children,
}: {
  id: Uuid
  live?: boolean
  notFound: ReactNode
  children: (sheet: AttendanceSheet, boardAt: number) => ReactNode
}) {
  const refresh = live ? LIVE : {}
  const detail = useQuery({ ...meetingSessionQuery(id), ...refresh })
  const board = useQuery({ ...attendanceBoardQuery(id), ...refresh })
  const corrections = useQuery({ ...attendanceCorrectionsQuery(id), ...refresh })

  return (
    <QueryState query={detail} notFound={notFound}>
      {(session) => (
        <QueryState query={board} notFound={notFound}>
          {(marks) =>
            children(sheetOf(session, marks, corrections.data?.items ?? []), board.dataUpdatedAt)
          }
        </QueryState>
      )}
    </QueryState>
  )
}
