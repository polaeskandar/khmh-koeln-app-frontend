"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"

import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
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
  const id = useId()
  const serviceError = errors["placement.serviceId"]
  const stageError = errors["placement.stageId"]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field data-invalid={serviceError ? true : undefined}>
        <FieldLabel htmlFor={`${id}-service`}>{t("service")}</FieldLabel>
        <NativeSelect
          id={`${id}-service`}
          className="w-full"
          value={choice.placement?.serviceId ?? ""}
          aria-invalid={serviceError ? true : undefined}
          onChange={(event) => choice.chooseService(event.target.value)}
        >
          {choice.services.map((s) => (
            <NativeSelectOption key={s.id} value={s.id}>
              {s.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {serviceError ? <FieldError>{serviceError}</FieldError> : null}
      </Field>
      <Field data-invalid={stageError ? true : undefined}>
        <FieldLabel htmlFor={`${id}-stage`}>{t("stage")}</FieldLabel>
        <NativeSelect
          id={`${id}-stage`}
          className="w-full"
          value={choice.placement?.stageId ?? ""}
          aria-invalid={stageError ? true : undefined}
          onChange={(event) => choice.chooseStage(event.target.value)}
        >
          <NativeSelectOption value="">{t("fields.noStage")}</NativeSelectOption>
          {choice.stages.map((stage) => (
            <NativeSelectOption key={stage.id} value={stage.id}>
              {stage.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {stageError ? <FieldError>{stageError}</FieldError> : null}
      </Field>
    </div>
  )
}
