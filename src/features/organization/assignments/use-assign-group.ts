"use client"

import { useTranslations } from "next-intl"

import type { Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import type { Group } from "@/lib/permissions"
import { placeLabel } from "@/lib/domain/place"

import { ASSIGNMENT_QUERIES, assignRequest } from "./api"

export function useAssignGroup(accountName: string, onAssigned: () => void) {
  const t = useTranslations("toast")

  return useApiMutation((accountId: Uuid, group: Group) => assignRequest(accountId, group), {
    successMessage: (assignment) =>
      t("groupAssigned", { name: isolate(accountName), where: isolate(placeLabel(assignment)) }),
    invalidate: ASSIGNMENT_QUERIES,
    onSuccess: onAssigned,
  })
}
