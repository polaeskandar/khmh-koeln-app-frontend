"use client"

import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useCallback, useState } from "react"
import { toast } from "sonner"

import { ApiError } from "./problem"
import { describeProblem, type Problem, type ProblemTranslator } from "./translate-problem"

export type MutationResult<T> = { ok: true; data: T } | { ok: false; problem: Problem }

type Options<T> = {
  onSuccess?: (data: T) => void
  successMessage?: string | ((data: T) => string)
  invalidate?: QueryKey[]
  awaitRefetch?: boolean
  toastOnError?: boolean
}

export function useApiMutation<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  {
    onSuccess,
    successMessage,
    invalidate = [],
    awaitRefetch = false,
    toastOnError = true,
  }: Options<T> = {}
) {
  const t = useTranslations() as unknown as ProblemTranslator
  const queryClient = useQueryClient()
  const mutation = useMutation({ mutationFn: (args: A) => fn(...args), retry: false })
  const [problem, setProblem] = useState<Problem | null>(null)
  const [refetching, setRefetching] = useState(false)
  const { mutateAsync } = mutation

  const execute = useCallback(
    async (...args: A): Promise<MutationResult<T>> => {
      setProblem(null)

      try {
        const data = await mutateAsync(args)

        if (successMessage) {
          toast.success(
            typeof successMessage === "function" ? successMessage(data) : successMessage
          )
        }

        const refetched = Promise.all(
          invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
        )

        if (awaitRefetch) {
          setRefetching(true)

          try {
            await refetched
          } finally {
            setRefetching(false)
          }
        }

        onSuccess?.(data)

        return { ok: true, data }
      } catch (error) {
        if (!(error instanceof ApiError)) {
          throw error
        }

        const found = describeProblem(error, t)
        setProblem(found)
        const shownInFields = error.status === 422 && Object.keys(found.fieldErrors).length > 0
        const signedOut = error.status === 401 && error.code === "auth.unauthenticated"

        if (toastOnError && !shownInFields && !signedOut) {
          toast.error(found.message)
        }

        return { ok: false, problem: found }
      }
    },
    [mutateAsync, successMessage, invalidate, awaitRefetch, queryClient, onSuccess, t, toastOnError]
  )

  return {
    execute,
    pending: mutation.isPending || refetching,
    problem,
    fieldErrors: problem?.fieldErrors ?? {},
    reset: useCallback(() => setProblem(null), []),
  }
}
