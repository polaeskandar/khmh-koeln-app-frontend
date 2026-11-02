"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRef } from "react"

import type { Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { publishHomeworkRequest } from "./api"

type Target = { id: Uuid; title: string }

export function usePublishHomework(message?: string) {
  const t = useTranslations("toast")
  const queryClient = useQueryClient()
  const inFlight = useRef(false)
  const published = useRef(new Set<Uuid>())

  const mutation = useApiMutation(
    async ({ id, title }: Target) => ({ ...(await publishHomeworkRequest(id)), title }),
    {
      successMessage: (published) => message ?? t("homeworkPublished", { title: published.title }),
    }
  )

  async function publish(target: Target) {
    if (inFlight.current || published.current.has(target.id)) {
      return null
    }

    inFlight.current = true

    try {
      const result = await mutation.execute(target)

      if (result.ok) {
        published.current.add(target.id)
      }

      await queryClient.invalidateQueries({ queryKey: ["homework"] })

      return result
    } finally {
      inFlight.current = false
    }
  }

  return { publish, pending: mutation.pending }
}
