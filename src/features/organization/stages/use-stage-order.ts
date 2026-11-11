"use client"

import type { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useMemo, useState } from "react"

import type { StageList } from "@/features/organization/services/api"
import { useRefetch } from "@/lib/api/refetch"
import type { Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { reorderStagesRequest, STAGE_ORDER_QUERIES } from "./api"

export type StageItem = StageList["stages"][number]

type LocalOrder = { ids: Uuid[]; savedKey: string }

export type StageOrder = ReturnType<typeof useStageOrder>

export function useStageOrder(service: Uuid, stages: StageItem[]) {
  const refetch = useRefetch()

  const byPosition = useMemo(() => [...stages].sort((a, b) => a.position - b.position), [stages])

  const byId = useMemo(() => new Map(byPosition.map((stage) => [stage.id, stage])), [byPosition])

  const saved = byPosition.map((stage) => stage.id)
  const savedKey = saved.join()
  const [local, setLocal] = useState<LocalOrder>({ ids: saved, savedKey })

  if (local.savedKey !== savedKey) {
    setLocal({ ids: saved, savedKey })
  }

  const order = local.ids

  const reorder = useApiMutation((ids: Uuid[]) => reorderStagesRequest(service, ids), {
    invalidate: STAGE_ORDER_QUERIES,
  })

  async function save(next: Uuid[]) {
    if (reorder.pending) {
      return
    }

    setLocal({ ids: next, savedKey })
    const result = await reorder.execute(next)

    if (!result.ok) {
      setLocal({ ids: saved, savedKey })
      void refetch(STAGE_ORDER_QUERIES)
    }
  }

  function move(id: Uuid, direction: -1 | 1) {
    const from = order.indexOf(id)
    const to = from + direction

    if (from < 0 || to < 0 || to >= order.length) {
      return
    }

    void save(arrayMove(order, from, to))
  }

  function drop({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) {
      return
    }

    const from = order.indexOf(String(active.id))
    const to = order.indexOf(String(over.id))

    if (from < 0 || to < 0) {
      return
    }

    void save(arrayMove(order, from, to))
  }

  const rows = order.flatMap((id) => {
    const stage = byId.get(id)

    return stage ? [stage] : []
  })

  return { order, rows, saving: reorder.pending, move, drop }
}
