"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { NoAccess } from "@/components/no-access"
import { QueryState } from "@/components/page-states"
import { ApiError } from "@/lib/api/problem"

import { type LessonOptions, lessonOptionsQuery, type LessonStage } from "./api"

export function WithOptions({
  stage,
  lesson,
  children,
}: {
  stage: LessonStage
  lesson?: string
  children: (choices: LessonOptions) => ReactNode
}) {
  const t = useTranslations("lessons")
  const options = useQuery(lessonOptionsQuery(stage.id, lesson))
  const forbidden = options.error instanceof ApiError && options.error.status === 403

  if (forbidden) {
    return (
      <NoAccess title={t("noAccess.prepareTitle")}>
        {t("noAccess.prepareBody", { stage: stage.name })}
      </NoAccess>
    )
  }

  return <QueryState query={options}>{children}</QueryState>
}
