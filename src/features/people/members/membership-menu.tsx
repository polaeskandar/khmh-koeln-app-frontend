"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowRightLeft, Ellipsis, UserMinus } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { servicesQuery } from "@/features/organization/services/api"
import { useCan } from "@/features/identity/auth/session"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { groupAt } from "@/lib/permissions"

import { MEMBERSHIP_QUERIES, moveMembershipRequest, type PersonRow, type Placement } from "./api"
import { useWhere } from "./use-where"

function useMoveTargets(row: PersonRow, placement: Placement) {
  const can = useCan()
  const services = useQuery(servicesQuery)
  const service = services.data?.items.find((item) => item.id === placement.service.id)

  if (
    !service ||
    service.archived ||
    !can("update", "members", groupAt(placement.service, placement.stage))
  ) {
    return []
  }

  const taken = new Set(row.placements.flatMap((other) => (other.stage ? [other.stage.id] : [])))

  return service.stages.filter(
    (stage) => !taken.has(stage.id) && can("update", "members", groupAt(service, stage))
  )
}

export function MembershipMenu({
  row,
  placement,
  onRemove,
}: {
  row: PersonRow
  placement: Placement
  onRemove: () => void
}) {
  const t = useTranslations()
  const can = useCan()
  const where = useWhere()
  const targets = useMoveTargets(row, placement)
  const remove = can("delete", "members", groupAt(placement.service, placement.stage))

  const move = useApiMutation(
    (stageId: string) => moveMembershipRequest(placement.membershipId, stageId),
    {
      successMessage: t("toast.membershipMoved"),
      invalidate: MEMBERSHIP_QUERIES,
      awaitRefetch: true,
    }
  )

  if (targets.length === 0 && !remove) {
    return null
  }

  async function moveTo(stageId: string) {
    const result = await move.execute(stageId)

    if (!result.ok && result.problem.status === 422) {
      toast.error(result.problem.fieldErrors.stageId ?? result.problem.message)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={move.pending}
          aria-label={t("common.actionsFor", { name: where(placement) })}
        >
          {move.pending ? <Spinner /> : <Ellipsis />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {targets.length > 0 ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowRightLeft />
              {t("members.membership.moveFromToday")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {targets.map((stage) => (
                <DropdownMenuItem key={stage.id} onSelect={() => void moveTo(stage.id)}>
                  <bdi>{stage.name}</bdi>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
        {remove ? (
          <DropdownMenuItem variant="destructive" onSelect={onRemove}>
            <UserMinus />
            {t("members.membership.removeFrom", { where: where(placement) })}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
