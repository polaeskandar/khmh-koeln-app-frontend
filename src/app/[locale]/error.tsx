"use client"

import { CircleAlert } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations()

  return (
    <div className="flex min-h-[60svh] items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleAlert />
          </EmptyMedia>
          <EmptyTitle>{t("errors.loadFailed")}</EmptyTitle>
          <EmptyDescription>{t("errors.internal")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => reset()}>{t("common.retry")}</Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
