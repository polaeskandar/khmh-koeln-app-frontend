"use client"

import { useMemo, useSyncExternalStore } from "react"

import type { LocalDate, LocalTime } from "@/lib/api/types/common"
import { localDateOf, localTimeOf } from "@/lib/domain/time"

const subscribe = (onChange: () => void) => {
  const timer = setInterval(onChange, 60_000)

  return () => clearInterval(timer)
}

const berlinNow = () => {
  const now = Date.now()

  return `${localDateOf(now)}T${localTimeOf(now)}`
}

const nothingOnTheServer = () => null

export function useNow(): { date: LocalDate; time: LocalTime } | null {
  const now = useSyncExternalStore(subscribe, berlinNow, nothingOnTheServer)

  return useMemo(() => {
    if (now === null) {
      return null
    }

    const [date, time] = now.split("T")

    return { date, time }
  }, [now])
}

export function useToday(): LocalDate | null {
  return useNow()?.date ?? null
}
