"use client"

import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { ApiError } from "./problem"
import { describeProblem, type Problem } from "./translate-problem"
import { useProblemTranslator } from "./use-problem-translator"

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
  const t = useProblemTranslator()
  const queryClient = useQueryClient()
  const [problem, setProblem] = useState<Problem | null>(null)

  const mutation = useMutation({
    mutationFn: (args: A) => fn(...args),
    retry: false,
    onSuccess: async (data) => {
      if (successMessage) {
        toast.success(typeof successMessage === "function" ? successMessage(data) : successMessage)
      }

      const refetched = Promise.all(
        invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
      )

      if (awaitRefetch) {
        await refetched
      }

      onSuccess?.(data)
    },
  })

  async function execute(...args: A): Promise<MutationResult<T>> {
    setProblem(null)

    try {
      return { ok: true, data: await mutation.mutateAsync(args) }
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
  }

  return {
    execute,
    data: mutation.data,
    pending: mutation.isPending,
    problem,
    fieldErrors: problem?.fieldErrors ?? {},
    reset: () => setProblem(null),
  }
}
