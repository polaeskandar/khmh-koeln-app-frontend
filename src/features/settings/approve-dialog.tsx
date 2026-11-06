"use client"

import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useFormat } from "@/i18n/format"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import {
  type AccountRequest,
  approveRequest,
  type DirectoryPerson,
  parentPortalOnly,
  rolesQuery,
} from "./api"
import { PersonSearch } from "./person-search"
import { RolesChoice } from "./roles-choice"

const CLOSE_AND_REFETCH = new Set(["accounts.alreadyApproved", "notFound.user"])

function Approval({ request, onDone }: { request: AccountRequest; onDone: () => void }) {
  const t = useTranslations()
  const f = useFormat()
  const queryClient = useQueryClient()
  const roles = useQuery(rolesQuery)
  const parent = request.registeredAs === "parent"
  const [children, setChildren] = useState<DirectoryPerson[]>([])
  const [ticked, setTicked] = useState<string[] | null>(null)

  const approve = useApiMutation(approveRequest, {
    successMessage: t("toast.accountApproved", { name: request.account.displayName }),
    invalidate: [["accountRequests"]],
    toastOnError: false,
    onSuccess: onDone,
  })

  const roleIds =
    ticked ??
    (parent ? (roles.data?.items ?? []).filter(parentPortalOnly).map((role) => role.id) : [])

  async function submit() {
    const result = await approve.execute(
      request.account.id,
      parent
        ? { as: "parent", childIds: children.map((child) => child.id), roleIds }
        : { as: "servant", roleIds }
    )

    if (!result.ok && result.problem.code && CLOSE_AND_REFETCH.has(result.problem.code)) {
      toast.error(result.problem.message)
      void queryClient.invalidateQueries({ queryKey: ["accountRequests"] })
      onDone()
    }
  }

  const errors = approve.fieldErrors

  const generalError =
    approve.problem &&
    Object.keys(errors).length === 0 &&
    !CLOSE_AND_REFETCH.has(approve.problem.code ?? "")
      ? approve.problem.message
      : null

  return (
    <>
      {request.note ? (
        <blockquote dir="auto" className="border-s-2 ps-3 text-sm text-muted-foreground">
          {request.note}
        </blockquote>
      ) : null}
      {parent ? (
        <Field data-invalid={errors.childIds ? true : undefined}>
          <FieldLabel>{t("accountRequests.approve.children")}</FieldLabel>
          <PersonSearch
            chosen={children}
            onChange={setChildren}
            label={t("accountRequests.approve.findChild")}
          />
          {errors.childIds ? <FieldError>{errors.childIds}</FieldError> : null}
        </Field>
      ) : request.services.length > 0 ? (
        <p className="text-sm">
          {t("accountRequests.approve.servesIn", {
            service: request.services.map((service) => service.name).join(f.separator),
          })}
        </p>
      ) : null}
      {roles.data ? (
        <RolesChoice
          roles={roles.data.items}
          selected={roleIds}
          onChange={setTicked}
          error={errors.roleIds}
        />
      ) : null}
      {generalError ? <FieldError>{generalError}</FieldError> : null}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={approve.pending} onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          disabled={approve.pending || roleIds.length === 0 || (parent && children.length === 0)}
          onClick={() => void submit()}
        >
          {approve.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("accountRequests.approve.submit")}
        </Button>
      </DialogFooter>
    </>
  )
}

export function ApproveButton({ request }: { request: AccountRequest }) {
  const t = useTranslations("accountRequests")
  const [open, setOpen] = useState(false)
  const busy = useIsMutating() > 0

  return (
    <>
      <Button onClick={() => setOpen(true)}>{t("approveButton")}</Button>
      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("approve.title", { name: request.account.displayName })}</DialogTitle>
            <DialogDescription>
              {request.registeredAs === "parent"
                ? t("approve.parentDescription")
                : t("approve.servantDescription")}
            </DialogDescription>
          </DialogHeader>
          {open ? (
            <div className="flex flex-col gap-4">
              <Approval request={request} onDone={() => setOpen(false)} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
