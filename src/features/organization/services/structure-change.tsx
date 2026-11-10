"use client"

import { useState } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { STRUCTURE_QUERIES } from "./api"

type Props = Omit<React.ComponentProps<typeof ConfirmDialog>, "onConfirm" | "note"> & {
  run: () => Promise<unknown>
  successMessage: string
  onSuccess?: () => void
}

export function StructureChangeDialog({
  run,
  successMessage,
  onSuccess,
  onOpenChange,
  ...props
}: Props) {
  const mutation = useApiMutation(run, {
    successMessage,
    toastOnError: false,
    invalidate: STRUCTURE_QUERIES,
    onSuccess,
  })

  const [shown, setShown] = useState(false)

  return (
    <ConfirmDialog
      {...props}
      onOpenChange={(open) => {
        if (!open) {
          setShown(false)
        }

        onOpenChange?.(open)
      }}
      note={
        shown && mutation.problem ? (
          <span role="alert" className="text-destructive">
            {mutation.problem.message}
          </span>
        ) : undefined
      }
      onConfirm={async () => {
        const result = await mutation.execute()
        setShown(!result.ok)

        return result.ok
      }}
    />
  )
}
