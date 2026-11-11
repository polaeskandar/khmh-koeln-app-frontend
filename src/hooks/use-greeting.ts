"use client"

import { useTranslations } from "next-intl"

import type { LocalTime } from "@/lib/api/types/common"

import { useNow } from "./use-today"

function partOfDay(time: LocalTime) {
  const hour = Number(time.slice(0, 2))

  if (hour < 12) {
    return "morning"
  }

  if (hour < 18) {
    return "afternoon"
  }

  return "evening"
}

export function useGreeting(name: string): string | null {
  const t = useTranslations("greeting")
  const now = useNow()

  return now ? t(partOfDay(now.time), { name: name.split(" ")[0] }) : null
}
