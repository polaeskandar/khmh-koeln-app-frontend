"use client"

import { Ellipsis } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import type { HomeworkRow } from "./api"
import { usePublishHomework } from "./use-publish-homework"

type Publish = ReturnType<typeof usePublishHomework>

export function HomeworkActionsMenu({ row, publish }: { row: HomeworkRow; publish: Publish }) {
  const t = useTranslations()
  const progress = row.can.viewProgress && row.status !== "draft"

  if (!progress && !row.can.edit && !row.can.publish) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("common.actionsFor", { name: row.title })}
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {progress ? (
          <DropdownMenuItem asChild>
            <Link href={routes.homework(row.id)}>{t("homework.actions.progress")}</Link>
          </DropdownMenuItem>
        ) : null}
        {row.can.edit ? (
          <DropdownMenuItem asChild>
            <Link href={routes.editHomework(row.id)}>{t("common.edit")}</Link>
          </DropdownMenuItem>
        ) : null}
        {row.can.publish ? (
          <DropdownMenuItem
            disabled={publish.pending}
            onSelect={() => void publish.publish({ id: row.id, title: row.title })}
          >
            {t("homework.actions.publishToParents")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function HomeworkRowActions({ row }: { row: HomeworkRow }) {
  const t = useTranslations("homework.actions")
  const publish = usePublishHomework()

  return (
    <span className="flex items-center justify-end gap-1">
      {row.can.publish ? (
        <Button
          variant="outline"
          size="sm"
          disabled={publish.pending}
          onClick={() => void publish.publish({ id: row.id, title: row.title })}
        >
          {publish.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("publish")}
        </Button>
      ) : null}
      <HomeworkActionsMenu row={row} publish={publish} />
    </span>
  )
}
