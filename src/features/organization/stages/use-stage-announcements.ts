"use client"

import type { Announcements, UniqueIdentifier } from "@dnd-kit/core"
import { useTranslations } from "next-intl"

import type { StageOrder } from "./use-stage-order"

export function useStageAnnouncements({ order, rows }: Pick<StageOrder, "order" | "rows">) {
  const t = useTranslations("stages.manager.announce")

  const nameOf = (id: UniqueIdentifier) => rows.find((stage) => stage.id === String(id))?.name ?? ""

  const at = (id: UniqueIdentifier) => ({
    position: order.indexOf(String(id)) + 1,
    total: order.length,
  })

  const announcements: Announcements = {
    onDragStart: ({ active }) => t("pickedUp", { name: nameOf(active.id), ...at(active.id) }),
    onDragOver: ({ active, over }) =>
      over ? t("moved", { name: nameOf(active.id), ...at(over.id) }) : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? t("dropped", { name: nameOf(active.id), ...at(over.id) })
        : t("canceled", { name: nameOf(active.id) }),
    onDragCancel: ({ active }) => t("canceled", { name: nameOf(active.id) }),
  }

  return announcements
}
