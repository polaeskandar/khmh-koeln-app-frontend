"use client"

import { useTranslations } from "next-intl"

import type { Counts } from "./api"

const ERASE_KEYS = [
  "person",
  "memberships",
  "attendance",
  "completions",
  "guardianLinks",
  "account",
  "roles",
] as const

export function useEraseLines() {
  const t = useTranslations("privacy.erase")

  return (counts: Counts) =>
    ERASE_KEYS.flatMap((key) => {
      const count = counts[key] ?? 0

      return count > 0 ? [t(key, { count })] : []
    })
}

export function Lines({ lines }: { lines: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1 ps-5 text-sm marker:text-muted-foreground">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}
