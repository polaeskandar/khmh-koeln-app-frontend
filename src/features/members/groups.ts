"use client"

import { useQuery } from "@tanstack/react-query"

import { servicesQuery } from "@/features/services/api"
import type { Uuid } from "@/lib/api/types/common"

export type GroupOption = {
  value: string
  label: string
  filter: { serviceId: Uuid } | { stageId: Uuid }
}

export function useGroupOptions(): GroupOption[] {
  const services = useQuery(servicesQuery)

  return (services.data?.items ?? [])
    .filter((service) => !service.archived && service.can.manageMembers)
    .flatMap((service) => [
      { value: `service:${service.id}`, label: service.name, filter: { serviceId: service.id } },
      ...service.stages
        .filter((stage) => stage.can.manageMembers)
        .map((stage) => ({
          value: `stage:${stage.id}`,
          label: `${service.name} · ${stage.name}`,
          filter: { stageId: stage.id },
        })),
    ])
}
