"use client"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "cn"
import { GripVertical } from "lucide-react"
import { useTranslations } from "next-intl"

import type { ServiceStages } from "@/features/organization/services/api"
import { useInBrowser } from "@/hooks/use-in-browser"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import { StageActionsMenu } from "./stage-actions"
import { useStageAnnouncements } from "./use-stage-announcements"
import type { StageItem, StageOrder } from "./use-stage-order"

type Service = ServiceStages["service"]

function SortableRow({
  stage,
  index,
  count,
  service,
  manage,
  interactive,
  saving,
  onMove,
}: {
  stage: StageItem
  index: number
  count: number
  service: Service
  manage: boolean
  interactive: boolean
  saving: boolean
  onMove: (id: string, direction: -1 | 1) => void
}) {
  const t = useTranslations("stages")

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    disabled: !manage || saving,
  })

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("border-b", isDragging && "relative z-10 bg-muted/80 shadow-sm")}
    >
      {manage ? (
        <td className="w-10 py-3">
          <button
            type="button"
            className="flex size-8 cursor-grab items-center justify-center text-muted-foreground hover:bg-muted active:cursor-grabbing"
            {...(interactive ? attributes : {})}
            {...(interactive ? (listeners ?? {}) : {})}
            tabIndex={interactive ? 0 : -1}
            aria-label={t("manager.dragHandle", { name: stage.name })}
          >
            <GripVertical className="size-4" />
          </button>
        </td>
      ) : null}
      <td className="py-3 text-muted-foreground tabular-nums">{index + 1}</td>
      <td className="py-3">
        <span className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={routes.stage(stage.id)}
            className="font-medium hover:underline hover:underline-offset-4"
          >
            {stage.name}
          </Link>
          {stage.description ? (
            <span dir="auto" className="truncate text-xs text-muted-foreground">
              {stage.description}
            </span>
          ) : null}
        </span>
      </td>
      <td className="py-3 text-end tabular-nums">{stage.memberCount}</td>
      {manage ? (
        <td className="py-3 text-end">
          <StageActionsMenu
            service={service}
            stage={stage}
            move={{
              up: index > 0 && !saving,
              down: index < count - 1 && !saving,
              onMove: (direction) => onMove(stage.id, direction),
            }}
          />
        </td>
      ) : null}
    </tr>
  )
}

function StagesTableHead({ manage }: { manage: boolean }) {
  const t = useTranslations("stages.manager.columns")

  return (
    <thead>
      <tr className="border-b text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {manage ? (
          <th scope="col" className="w-10 py-2">
            <span className="sr-only">{t("order")}</span>
          </th>
        ) : null}
        <th scope="col" className="w-12 py-2 text-start">
          {t("position")}
        </th>
        <th scope="col" className="py-2 text-start">
          {t("stage")}
        </th>
        <th scope="col" className="w-24 py-2 text-end">
          {t("members")}
        </th>
        {manage ? (
          <th scope="col" className="w-12 py-2">
            <span className="sr-only">{t("actions")}</span>
          </th>
        ) : null}
      </tr>
    </thead>
  )
}

export function StagesTable({
  service,
  manage,
  stageOrder,
}: {
  service: Service
  manage: boolean
  stageOrder: StageOrder
}) {
  const t = useTranslations("stages.manager")
  const mounted = useInBrowser()
  const announcements = useStageAnnouncements(stageOrder)
  const { order, rows, saving, move, drop } = stageOrder

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={drop}
      accessibility={{
        screenReaderInstructions: { draggable: t("instructions") },
        announcements,
      }}
    >
      <table className="w-full text-sm">
        <StagesTableHead manage={manage} />
        <tbody>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            {rows.map((stage, index) => (
              <SortableRow
                key={stage.id}
                stage={stage}
                index={index}
                count={rows.length}
                service={service}
                manage={manage}
                interactive={mounted}
                saving={saving}
                onMove={move}
              />
            ))}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  )
}
