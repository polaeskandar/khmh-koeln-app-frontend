"use client"

import type { UseQueryResult } from "@tanstack/react-query"
import { CircleAlert, SearchX } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { NoAccess } from "@/components/no-access"
import { PageLoading } from "@/components/page-loading"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Link } from "@/i18n/navigation"
import { ApiError } from "@/lib/api/problem"
import { translateProblem } from "@/lib/api/translate-problem"
import { useProblemTranslator } from "@/lib/api/use-problem-translator"
import { routes } from "@/lib/routes"

export function NotFoundState({
  home = routes.home(),
  homeLabel,
  title,
  description,
}: {
  home?: string
  homeLabel?: string
  title?: string
  description?: string
}) {
  const t = useTranslations("notFound")

  return (
    <div className="flex min-h-[60svh] items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>{title ?? t("title")}</EmptyTitle>
          <EmptyDescription>{description ?? t("app.description")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href={home}>{homeLabel ?? t("app.action")}</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}

export function QueryErrorState({ error, onRetry }: { error: unknown; onRetry: () => unknown }) {
  const t = useTranslations()
  const translate = useProblemTranslator()

  const message =
    error instanceof ApiError ? translateProblem(error, translate) : t("errors.internal")

  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert />
        </EmptyMedia>
        <EmptyTitle>{t("errors.loadFailed")}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={() => onRetry()}>
          {t("common.retry")}
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export function QueryState<T>({
  query,
  loading = <PageLoading />,
  notFound = <NotFoundState />,
  children,
}: {
  query: UseQueryResult<T>
  loading?: ReactNode
  notFound?: ReactNode
  children: (data: T) => ReactNode
}) {
  const t = useTranslations("errors")

  if (query.data !== undefined) {
    return children(query.data)
  }

  if (query.isPending) {
    return loading
  }

  const status = query.error instanceof ApiError ? query.error.status : null

  if (status === 404) {
    return notFound
  }

  if (status === 403) {
    return <NoAccess title={t("title.forbidden")}>{t("forbidden")}</NoAccess>
  }

  return <QueryErrorState error={query.error} onRetry={() => query.refetch()} />
}
