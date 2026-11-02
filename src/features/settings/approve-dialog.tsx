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
import { useApiMutation } from "@/lib/api/use-api-mutation"

import {
  type AccountRequest,
  approveRequest,
  type DirectoryPerson,
  parentPortalOnly,
  rolesQuery,
} from "./api"
import { PersonSearch } from "./person-search"

const CLOSE_AND_REFETCH = new Set(["accounts.alreadyApproved", "notFound.user"])

function ParentApproval({ request, onDone }: { request: AccountRequest; onDone: () => void }) {
  const t = useTranslations()
  const queryClient = useQueryClient()
  const roles = useQuery(rolesQuery)
  const [children, setChildren] = useState<DirectoryPerson[]>([])

  const approve = useApiMutation(approveRequest, {
    successMessage: t("toast.accountApproved", { name: request.account.displayName }),
    invalidate: [["accountRequests"]],
    toastOnError: false,
    onSuccess: onDone,
  })

  const parentRoleIds = (roles.data?.items ?? []).filter(parentPortalOnly).map((role) => role.id)

  async function submit() {
    const result = await approve.execute(request.account.id, {
      as: "parent",
      childIds: children.map((child) => child.id),
      roleIds: parentRoleIds,
    })

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
      <Field data-invalid={errors.childIds ? true : undefined}>
        <FieldLabel>{t("accountRequests.approve.children")}</FieldLabel>
        <PersonSearch
          chosen={children}
          onChange={setChildren}
          label={t("accountRequests.approve.findChild")}
        />
        {errors.childIds ? <FieldError>{errors.childIds}</FieldError> : null}
        {errors.roleIds ? <FieldError>{errors.roleIds}</FieldError> : null}
        {generalError ? <FieldError>{generalError}</FieldError> : null}
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={approve.pending} onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          disabled={approve.pending || children.length === 0 || !roles.data}
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
            <DialogDescription>{t("approve.parentDescription")}</DialogDescription>
          </DialogHeader>
          {open ? (
            <div className="flex flex-col gap-4">
              <ParentApproval request={request} onDone={() => setOpen(false)} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
