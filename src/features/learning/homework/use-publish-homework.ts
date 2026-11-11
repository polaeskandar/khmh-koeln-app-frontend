"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRef } from "react"

import { useSubmitOnce } from "@/hooks/use-submit-once"
import type { Instant, Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { HOMEWORK_QUERIES, publishHomeworkRequest } from "./api"

type Target = { id: Uuid; title: string; publishedAt: Instant | null }

export function usePublishHomework(message?: string) {
  const t = useTranslations("toast")
  const queryClient = useQueryClient()
  const published = useRef(new Set<string>())

  const mutation = useApiMutation(
    async ({ id, title }: Target) => ({ ...(await publishHomeworkRequest(id)), title }),
    {
      successMessage: (published) => message ?? t("homeworkPublished", { title: published.title }),
    }
  )

  const publishOnce = useSubmitOnce(async (target: Target, attempt: string) => {
    const result = await mutation.execute(target)

    if (result.ok) {
      published.current.add(attempt)
    }

    await Promise.all(
      HOMEWORK_QUERIES.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
    )

    return result
  })

  async function publish(target: Target) {
    const attempt = `${target.id}@${target.publishedAt ?? "never"}`

    if (published.current.has(attempt)) {
      return null
    }

    return (await publishOnce(target, attempt)) ?? null
  }

  return { publish, pending: mutation.pending }
}
