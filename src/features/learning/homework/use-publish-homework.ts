"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRef } from "react"

import type { Instant, Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { publishHomeworkRequest } from "@/features/learning/homework/api"

type Target = { id: Uuid; title: string; publishedAt: Instant | null }

export function usePublishHomework(message?: string) {
  const t = useTranslations("toast")
  const queryClient = useQueryClient()
  const inFlight = useRef(false)
  const published = useRef(new Set<string>())

  const mutation = useApiMutation(
    async ({ id, title }: Target) => ({ ...(await publishHomeworkRequest(id)), title }),
    {
      successMessage: (published) => message ?? t("homeworkPublished", { title: published.title }),
    }
  )

  async function publish(target: Target) {
    const attempt = `${target.id}@${target.publishedAt ?? "never"}`

    if (inFlight.current || published.current.has(attempt)) {
      return null
    }

    inFlight.current = true

    try {
      const result = await mutation.execute(target)

      if (result.ok) {
        published.current.add(attempt)
      }

      await queryClient.invalidateQueries({ queryKey: ["homework"] })

      return result
    } finally {
      inFlight.current = false
    }
  }

  return { publish, pending: mutation.pending }
}
