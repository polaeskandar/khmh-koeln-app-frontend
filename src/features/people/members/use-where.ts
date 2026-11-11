"use client"

import { useTranslations } from "next-intl"

import type { PlacementRow } from "./api"

export function useWhere() {
  const t = useTranslations("members.sheet")

  return (p: Pick<PlacementRow, "service" | "stage">) =>
    p.stage
      ? `${p.stage.name} (${p.service.name})`
      : t("serviceNoStage", { service: p.service.name })
}
