"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import type { LessonDetail } from "./api"
import { LessonPanel } from "./visibility"

export function LessonHomework({ detail, canAdd }: { detail: LessonDetail; canAdd: boolean }) {
  const t = useTranslations()
  const { lesson, stage, homework } = detail

  return (
    <LessonPanel
      title={t("lessons.detail.homework")}
      actions={
        canAdd ? (
          <Button size="sm" variant="outline" asChild>
            <Link href={routes.newHomework(stage.id, lesson.id)}>
              <Plus data-icon="inline-start" />
              {t("lessons.detail.addHomework")}
            </Link>
          </Button>
        ) : null
      }
    >
      <p className="text-sm text-muted-foreground">
        {homework.total > 0 ? (
          <Link href={routes.stageHomework(stage.id)} className="underline underline-offset-4">
            {[
              t("counts.homework", { count: homework.total }),
              homework.drafts > 0 ? t("lessons.list.drafts", { count: homework.drafts }) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Link>
        ) : (
          t("lessons.detail.noHomework")
        )}
      </p>
    </LessonPanel>
  )
}
