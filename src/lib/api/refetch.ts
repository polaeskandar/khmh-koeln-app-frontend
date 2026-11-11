"use client"

import { type QueryKey, useQueryClient } from "@tanstack/react-query"

import type { Problem } from "./translate-problem"

type ChangedMeanwhile = number | string

export function isStale(
  problem: Pick<Problem, "status" | "code">,
  signs: readonly ChangedMeanwhile[]
): boolean {
  return signs.includes(problem.status) || (problem.code !== null && signs.includes(problem.code))
}

export function useRefetch() {
  const queryClient = useQueryClient()

  return function refetch(keys: readonly QueryKey[]) {
    return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
  }
}
