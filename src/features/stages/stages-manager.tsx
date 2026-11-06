"use client"

import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { cn } from "cn"
import { GripVertical } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState, useSyncExternalStore } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader } from "@/components/page-header"
import { NotFoundState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { type ServiceStages, serviceStagesQuery } from "@/features/services/api"
import { Link } from "@/i18n/navigation"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import { reorderStagesRequest } from "./api"
import { AddStageButton, StageActionsMenu } from "./stage-dialogs"

type StageItem = ServiceStages["stages"][number]

const noSubscription = () => () => {}

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
  service: ServiceStages["service"]
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

function Manager({ data }: { data: ServiceStages }) {
  const t = useTranslations()
  const queryClient = useQueryClient()
  const { service } = data

  const stages = useMemo(
    () => [...data.stages].sort((a, b) => a.position - b.position),
    [data.stages]
  )

  const manage = data.can.manageStructure
  const byId = useMemo(() => new Map(stages.map((stage) => [stage.id, stage])), [stages])
  const key = stages.map((stage) => stage.id).join()
  const [order, setOrder] = useState(() => stages.map((stage) => stage.id))
  const [syncedKey, setSyncedKey] = useState(key)

  if (key !== syncedKey) {
    setSyncedKey(key)
    setOrder(stages.map((stage) => stage.id))
  }

  const mounted = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false
  )

  const reorder = useApiMutation((ids: string[]) => reorderStagesRequest(service.id, ids))

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function save(next: string[]) {
    if (reorder.pending) {
      return
    }

    const previous = order
    setOrder(next)
    const result = await reorder.execute(next)

    if (!result.ok) {
      setOrder(previous)
    }

    void queryClient.invalidateQueries({ queryKey: ["services"] })
  }

  const move = (id: string, direction: -1 | 1) => {
    const from = order.indexOf(id)
    const to = from + direction

    if (from < 0 || to < 0 || to >= order.length) {
      return
    }

    void save(arrayMove(order, from, to))
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
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

  const nameOf = (id: UniqueIdentifier) => byId.get(String(id))?.name ?? ""

  const at = (id: UniqueIdentifier) => ({
    position: order.indexOf(String(id)) + 1,
    total: order.length,
  })

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      t("stages.manager.announce.pickedUp", { name: nameOf(active.id), ...at(active.id) }),
    onDragOver: ({ active, over }) =>
      over
        ? t("stages.manager.announce.moved", { name: nameOf(active.id), ...at(over.id) })
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? t("stages.manager.announce.dropped", { name: nameOf(active.id), ...at(over.id) })
        : t("stages.manager.announce.canceled", { name: nameOf(active.id) }),
    onDragCancel: ({ active }) =>
      t("stages.manager.announce.canceled", { name: nameOf(active.id) }),
  }

  const rows = order.flatMap((id) => {
    const stage = byId.get(id)

    return stage ? [stage] : []
  })

  return (
    <>
      <Topbar
        crumbs={[
          { label: t("nav.services"), href: routes.services() },
          { label: service.name, href: routes.service(service.id) },
          { label: t("stages.title") },
        ]}
      />
      <PageBody>
        <PageHeader
          title={t("stages.page.title", { name: service.name })}
          description={manage && rows.length > 1 ? t("stages.page.hint") : undefined}
          actions={manage ? <AddStageButton service={service} /> : null}
        />
        {rows.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyDescription>
                {t("stages.manager.empty", { name: service.name })}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={onDragEnd}
            accessibility={{
              screenReaderInstructions: { draggable: t("stages.manager.instructions") },
              announcements,
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {manage ? (
                    <th scope="col" className="w-10 py-2">
                      <span className="sr-only">{t("stages.manager.columns.order")}</span>
                    </th>
                  ) : null}
                  <th scope="col" className="w-12 py-2 text-start">
                    {t("stages.manager.columns.position")}
                  </th>
                  <th scope="col" className="py-2 text-start">
                    {t("stages.manager.columns.stage")}
                  </th>
                  <th scope="col" className="w-24 py-2 text-end">
                    {t("stages.manager.columns.members")}
                  </th>
                  {manage ? (
                    <th scope="col" className="w-12 py-2">
                      <span className="sr-only">{t("stages.manager.columns.actions")}</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
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
                      saving={reorder.pending}
                      onMove={move}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        )}
      </PageBody>
    </>
  )
}

function NotFoundPage() {
  const t = useTranslations("nav")

  return (
    <>
      <Topbar crumbs={[{ label: t("services"), href: routes.services() }]} />
      <NotFoundState home={routes.services()} />
    </>
  )
}

function LoadedManager({ id }: { id: string }) {
  const query = useQuery(serviceStagesQuery(id))

  return (
    <QueryState query={query} notFound={<NotFoundPage />}>
      {(data) => <Manager data={data} />}
    </QueryState>
  )
}

export function StagesManager() {
  return <RecordPage notFound={<NotFoundPage />}>{(id) => <LoadedManager id={id} />}</RecordPage>
}
