"use client"

import { useQuery } from "@tanstack/react-query"

import { servicesQuery } from "@/features/organization/services/api"
import type { Uuid } from "@/lib/api/types/common"

export type GroupOption = {
  value: string
  label: string
  filter: { serviceId: Uuid } | { stageId: Uuid }
  placement: { serviceId: Uuid; stageId: Uuid | null }
}

export function useGroupOptions(): GroupOption[] {
  const services = useQuery(servicesQuery)

  return (services.data?.items ?? [])
    .filter((service) => !service.archived)
    .flatMap((service) => [
      {
        value: `service:${service.id}`,
        label: service.name,
        filter: { serviceId: service.id },
        placement: { serviceId: service.id, stageId: null },
      },
      ...service.stages.map((stage) => ({
        value: `stage:${stage.id}`,
        label: `${service.name} · ${stage.name}`,
        filter: { stageId: stage.id },
        placement: { serviceId: service.id, stageId: stage.id },
      })),
    ])
}

type GroupPlacement = GroupOption["placement"]

export function blocksPlacement(held: GroupPlacement, wanted: GroupPlacement): boolean {
  if (held.serviceId !== wanted.serviceId) {
    return false
  }

  return held.stageId === wanted.stageId || (held.stageId === null) !== (wanted.stageId === null)
}
