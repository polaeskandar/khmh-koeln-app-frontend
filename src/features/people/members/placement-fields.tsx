"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { SelectField } from "@/components/form-fields"
import { NativeSelectOption } from "@/components/ui/native-select"
import { servicesQuery } from "@/features/organization/services/api"

import type { PlacementInput } from "./api"

export function usePlacement(preset?: PlacementInput) {
  const services = (useQuery(servicesQuery).data?.items ?? []).filter((s) => !s.archived)
  const [serviceId, setServiceId] = useState(preset?.serviceId ?? "")
  const [stageId, setStageId] = useState(preset?.stageId ?? "")
  const service = services.find((s) => s.id === serviceId) ?? services[0]
  const stages = service?.stages ?? []
  const chosenStage = stages.some((stage) => stage.id === stageId) ? stageId : ""

  const placement: PlacementInput | null = service
    ? { serviceId: service.id, stageId: chosenStage || null }
    : null

  return {
    services,
    stages,
    placement,
    chooseService: (id: string) => {
      setServiceId(id)
      setStageId("")
    },
    chooseStage: setStageId,
  }
}

export function PlacementFields({
  choice,
  errors,
}: {
  choice: ReturnType<typeof usePlacement>
  errors: Record<string, string | undefined>
}) {
  const t = useTranslations("members")

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label={t("service")}
        value={choice.placement?.serviceId ?? ""}
        error={errors["placement.serviceId"]}
        onChange={(event) => choice.chooseService(event.target.value)}
      >
        {choice.services.map((s) => (
          <NativeSelectOption key={s.id} value={s.id}>
            {s.name}
          </NativeSelectOption>
        ))}
      </SelectField>
      <SelectField
        label={t("stage")}
        value={choice.placement?.stageId ?? ""}
        error={errors["placement.stageId"]}
        onChange={(event) => choice.chooseStage(event.target.value)}
      >
        <NativeSelectOption value="">{t("fields.noStage")}</NativeSelectOption>
        {choice.stages.map((stage) => (
          <NativeSelectOption key={stage.id} value={stage.id}>
            {stage.name}
          </NativeSelectOption>
        ))}
      </SelectField>
    </div>
  )
}
