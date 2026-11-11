"use client"

import type { ComponentProps } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { STRUCTURE_QUERIES } from "./api"

type Props = Omit<ComponentProps<typeof ConfirmDialog>, "onConfirm" | "note"> & {
  request: () => Promise<unknown>
  successMessage: string
  onSuccess?: () => void
}

export function StructureChangeDialog({
  request,
  successMessage,
  onSuccess,
  onOpenChange,
  ...props
}: Props) {
  const mutation = useApiMutation(request, {
    successMessage,
    toastOnError: false,
    invalidate: STRUCTURE_QUERIES,
    onSuccess,
  })

  return (
    <ConfirmDialog
      {...props}
      onOpenChange={(open) => {
        if (!open) {
          mutation.reset()
        }

        onOpenChange?.(open)
      }}
      note={
        mutation.problem ? (
          <span role="alert" className="text-destructive">
            {mutation.problem.message}
          </span>
        ) : undefined
      }
      onConfirm={async () => (await mutation.execute()).ok}
    />
  )
}
