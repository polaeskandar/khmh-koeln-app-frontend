"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowRightLeft, Ellipsis, UserMinus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { TextField } from "@/components/form-fields"
import { MemberAvatar } from "@/components/member-avatar"
import { ServiceSwatch } from "@/components/service-tag"
import { StatusBadge } from "@/components/status"
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
import { FieldGroup } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { servicesQuery } from "@/features/organization/services/api"
import { useCan } from "@/features/identity/auth/session"
import { useInlineEnd } from "@/i18n/direction"
import { useFormat } from "@/i18n/format"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { fullName, initials, preferredName } from "@/lib/domain/names"
import { canInAny, groupAt } from "@/lib/permissions"

import {
  deactivatePersonRequest,
  endMembershipRequest,
  joinRequest,
  MEMBERSHIP_QUERIES,
  type PersonNames,
  type PersonRow,
  type Placement,
  reactivatePersonRequest,
  renamePersonRequest,
  moveMembershipRequest,
} from "./api"
import { blocksPlacement, useGroupOptions } from "./groups"

function useWhere() {
  const t = useTranslations("members.sheet")

  return (p: Pick<Placement, "service" | "stage">) =>
    p.stage
      ? `${p.stage.name} (${p.service.name})`
      : t("serviceNoStage", { service: p.service.name })
}

function NameForm({ person }: { person: PersonRow["person"] }) {
  const t = useTranslations()

  const [edits, setEdits] = useState<Partial<PersonNames>>({})

  const names: PersonNames = {
    firstName: edits.firstName ?? person.firstName,
    lastName: edits.lastName ?? person.lastName,
    displayName: edits.displayName === undefined ? person.displayName : edits.displayName,
  }

  const rename = useApiMutation((next: PersonNames) => renamePersonRequest(person.id, next), {
    successMessage: t("toast.saved"),
    invalidate: [["people"], ["services"]],
    awaitRefetch: true,
    onSuccess: () => setEdits({}),
  })

  const next: PersonNames = { ...names, displayName: names.displayName || null }

  const changed =
    next.firstName !== person.firstName ||
    next.lastName !== person.lastName ||
    next.displayName !== person.displayName

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()

        if (changed) {
          void rename.execute(next)
        }
      }}
    >
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("members.fields.firstName")}
            maxLength={80}
            value={names.firstName}
            onChange={(event) => setEdits({ ...edits, firstName: event.target.value })}
            error={rename.fieldErrors.firstName}
          />
          <TextField
            label={t("members.fields.lastName")}
            maxLength={80}
            value={names.lastName}
            onChange={(event) => setEdits({ ...edits, lastName: event.target.value })}
            error={rename.fieldErrors.lastName}
          />
        </div>
        <TextField
          label={t("members.fields.displayName")}
          optional
          maxLength={120}
          description={t("members.fields.displayNameHintShort")}
          value={names.displayName ?? ""}
          onChange={(event) => setEdits({ ...edits, displayName: event.target.value })}
          error={rename.fieldErrors.displayName}
        />
      </FieldGroup>
      {changed ? (
        <Button type="submit" className="self-start" disabled={rename.pending}>
          {rename.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("members.sheet.saveName")}
        </Button>
      ) : null}
    </form>
  )
}

function useMoveTargets(person: PersonRow, placement: Placement) {
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

  const taken = new Set(person.placements.flatMap((other) => (other.stage ? [other.stage.id] : [])))

  return service.stages.filter(
    (stage) => !taken.has(stage.id) && can("update", "members", groupAt(service, stage))
  )
}

function MembershipMenu({
  person,
  placement,
  onRemove,
}: {
  person: PersonRow
  placement: Placement
  onRemove: () => void
}) {
  const t = useTranslations()
  const can = useCan()
  const where = useWhere()
  const targets = useMoveTargets(person, placement)
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

function Placements({ person }: { person: PersonRow }) {
  const t = useTranslations()
  const f = useFormat()
  const where = useWhere()
  const [ending, setEnding] = useState<Placement | null>(null)

  const end = useApiMutation(endMembershipRequest, {
    successMessage: t("toast.membershipEnded"),
    invalidate: MEMBERSHIP_QUERIES,
    awaitRefetch: true,
  })

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("members.belongsTo")}
      </h3>
      {person.placements.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("members.sheet.noServiceNow")}</p>
      ) : (
        <ul className="flex flex-col divide-y border-y">
          {person.placements.map((placement) => (
            <li
              key={placement.membershipId}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <ServiceSwatch tone={placement.service.tone} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">{where(placement)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("members.sheet.since", { date: f.mediumDate(placement.startsOn) })}
                  </span>
                </span>
              </span>
              {person.person.status === "active" ? (
                <MembershipMenu
                  person={person}
                  placement={placement}
                  onRemove={() => setEnding(placement)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={ending !== null}
        onOpenChange={(open) => !open && setEnding(null)}
        title={
          ending
            ? t("members.membership.removeTitle", {
                name: preferredName(person.person),
                where: where(ending),
              })
            : ""
        }
        description={t("members.membership.removeDescription")}
        confirmLabel={t("members.membership.remove")}
        tone="destructive"
        onConfirm={async () => {
          if (!ending) {
            return true
          }

          return (await end.execute(ending.membershipId)).ok
        }}
      />
    </section>
  )
}

function AddTo({ person }: { person: PersonRow }) {
  const t = useTranslations()
  const options = useGroupOptions()

  const held = person.placements.map((p) => ({
    serviceId: p.service.id,
    stageId: p.stage?.id ?? null,
  }))

  const missing = options.filter(
    (option) => !held.some((placement) => blocksPlacement(placement, option.placement))
  )

  const [chosen, setChosen] = useState("")

  const join = useApiMutation(joinRequest, {
    successMessage: t("toast.membershipAdded"),
    invalidate: MEMBERSHIP_QUERIES,
    awaitRefetch: true,
    onSuccess: () => setChosen(""),
  })

  if (missing.length === 0) {
    return null
  }

  const option = missing.find((o) => o.value === chosen) ?? missing[0]

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("members.sheet.addTo")}
      </h3>
      <div className="flex gap-2">
        <NativeSelect
          aria-label={t("members.sheet.addTo")}
          className="w-full"
          value={option.value}
          onChange={(event) => setChosen(event.target.value)}
        >
          {missing.map((o) => (
            <NativeSelectOption key={o.value} value={o.value}>
              {o.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          variant="outline"
          disabled={join.pending}
          onClick={() => void join.execute(person.person.id, option.placement)}
        >
          {join.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("members.sheet.add")}
        </Button>
      </div>
    </section>
  )
}

function Earlier({ placements }: { placements: Placement[] }) {
  const t = useTranslations("members.sheet")
  const f = useFormat()
  const where = useWhere()

  if (placements.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("earlier")}
      </h3>
      <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
        {placements.map((placement) => (
          <li key={placement.membershipId}>
            {t("pastPlacement", {
              where: where(placement),
              from: f.mediumDate(placement.startsOn),
              to: placement.endsOn ? f.mediumDate(placement.endsOn) : "",
            })}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function InactiveBadge() {
  const t = useTranslations("common")

  return (
    <StatusBadge tone="muted" className="shrink-0">
      {t("inactive")}
    </StatusBadge>
  )
}

function StatusAction({
  person,
  onChange,
}: {
  person: PersonRow
  onChange?: (person: PersonRow) => void
}) {
  const t = useTranslations()
  const [confirming, setConfirming] = useState(false)

  const changed = (next: PersonRow["person"]) =>
    onChange?.({
      ...person,
      person: next,
      placements: next.status === "inactive" ? [] : person.placements,
    })

  const deactivate = useApiMutation(deactivatePersonRequest, {
    successMessage: (next) => t("toast.personInactive", { name: preferredName(next) }),
    invalidate: MEMBERSHIP_QUERIES,
    awaitRefetch: true,
    onSuccess: changed,
  })

  const reactivate = useApiMutation(reactivatePersonRequest, {
    successMessage: (next) => t("toast.personReactivated", { name: preferredName(next) }),
    invalidate: MEMBERSHIP_QUERIES,
    awaitRefetch: true,
    onSuccess: changed,
  })

  if (person.person.status === "inactive") {
    return (
      <Button
        variant="outline"
        disabled={reactivate.pending}
        onClick={() => void reactivate.execute(person.person.id)}
      >
        {reactivate.pending ? <Spinner data-icon="inline-start" /> : null}
        {t("members.sheet.reactivate")}
      </Button>
    )
  }

  return (
    <>
      <Button variant="outline" onClick={() => setConfirming(true)}>
        {t("members.sheet.markInactive")}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("members.sheet.inactiveTitle", { name: isolate(preferredName(person.person)) })}
        description={t("members.sheet.inactiveDescription")}
        consequences={[
          t("members.sheet.inactiveConsequences.rosters"),
          t("members.sheet.inactiveConsequences.history"),
          t("members.sheet.inactiveConsequences.reactivate"),
        ]}
        confirmLabel={t("members.sheet.markInactive")}
        onConfirm={async () => (await deactivate.execute(person.person.id)).ok}
      />
    </>
  )
}

export function PersonSheet({
  person,
  onOpenChange,
  onStatusChange,
}: {
  person: PersonRow | null
  onOpenChange: (open: boolean) => void
  onStatusChange?: (person: PersonRow) => void
}) {
  const t = useTranslations("members.sheet")
  const can = useCan()
  const side = useInlineEnd()

  const edit =
    person !== null &&
    canInAny(
      can,
      "update",
      "members",
      person.placements.map((placement) => groupAt(placement.service, placement.stage))
    )

  return (
    <Sheet open={person !== null} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="w-full gap-6 overflow-y-auto sm:max-w-md">
        {person ? (
          <>
            <SheetHeader className="flex-row items-center gap-3">
              <MemberAvatar
                name={preferredName(person.person)}
                initials={initials(person.person)}
                seed={person.person.id}
                className="size-10"
              />
              <span className="flex min-w-0 flex-col">
                <span className="flex min-w-0 items-center gap-2">
                  <SheetTitle className="truncate">{preferredName(person.person)}</SheetTitle>
                  {person.person.status === "inactive" ? <InactiveBadge /> : null}
                </span>
                <SheetDescription className="truncate">
                  {person.person.displayName ? fullName(person.person) : t("member")}
                </SheetDescription>
              </span>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-6">
              {edit ? <NameForm key={person.person.id} person={person.person} /> : null}
              <Placements person={person} />
              {edit && person.person.status === "active" ? <AddTo person={person} /> : null}
              <Earlier placements={person.pastPlacements} />
            </div>
            {edit ? (
              <SheetFooter className="border-t">
                <StatusAction person={person} onChange={onStatusChange} />
              </SheetFooter>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
