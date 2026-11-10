"use client"

import { useTranslations } from "next-intl"

import type { ProblemTranslator } from "./translate-problem"

export function useProblemTranslator(): ProblemTranslator {
  return useTranslations() as unknown as ProblemTranslator
}
