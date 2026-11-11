"use client"

import type { QueryKey } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { toast } from "sonner"

import { FormDialog } from "@/components/form-dialog"
import { FieldError } from "@/components/ui/field"
import { isStale, useRefetch } from "@/lib/api/refetch"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { ACCOUNT_REQUEST_QUERIES, type AccountRequest, type Approval, approveRequest } from "./api"

const CHANGED_MEANWHILE = ["accounts.alreadyApproved", "notFound.user"]

export function useApproval(request: AccountRequest, invalidate: QueryKey[], onClose: () => void) {
  const t = useTranslations("accountRequests.toast")
  const refetch = useRefetch()

  const approve = useApiMutation(approveRequest, {
    successMessage: t("approved", { name: request.account.displayName }),
    invalidate,
    toastOnError: false,
    onSuccess: onClose,
  })

  async function send(approval: Approval) {
    const result = await approve.execute(request.account.id, approval)

    if (!result.ok && isStale(result.problem, CHANGED_MEANWHILE)) {
      toast.error(result.problem.message)
      void refetch(ACCOUNT_REQUEST_QUERIES)
      onClose()
    }
  }

  const generalError =
    approve.problem &&
    Object.keys(approve.fieldErrors).length === 0 &&
    !isStale(approve.problem, CHANGED_MEANWHILE)
      ? approve.problem.message
      : null

  return {
    send,
    pending: approve.pending,
    problem: approve.problem,
    fieldErrors: approve.fieldErrors,
    generalError,
  }
}

export function ApprovalDialog({
  request,
  description,
  generalError,
  pending,
  problem,
  submitDisabled,
  onSubmit,
  onClose,
  children,
}: {
  request: AccountRequest
  description: string
  generalError: string | null
  pending: boolean
  problem: unknown
  submitDisabled: boolean
  onSubmit: () => unknown
  onClose: () => void
  children: ReactNode
}) {
  const t = useTranslations("accountRequests.approve")

  return (
    <FormDialog
      title={t("title", { name: request.account.displayName })}
      description={description}
      pending={pending}
      problem={problem}
      submitLabel={t("submit")}
      submitDisabled={submitDisabled}
      submitOnEnter={false}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      {request.note ? (
        <blockquote dir="auto" className="border-s-2 ps-3 text-sm text-muted-foreground">
          {request.note}
        </blockquote>
      ) : null}
      {children}
      {generalError ? <FieldError>{generalError}</FieldError> : null}
    </FormDialog>
  )
}
