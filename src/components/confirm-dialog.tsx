"use client"

import { type ReactNode, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useDialogMount } from "@/components/dialog-mount"
import { FormField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

type Controlled = { open?: boolean; onOpenChange?: (open: boolean) => void }

async function whilePending(setPending: (pending: boolean) => void, run: () => Promise<boolean>) {
  setPending(true)

  try {
    return await run()
  } catch {
    return false
  } finally {
    setPending(false)
  }
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  consequences,
  note,
  confirmLabel,
  tone = "default",
  onConfirm,
  open: controlledOpen,
  onOpenChange,
}: Controlled & {
  trigger?: ReactNode
  title: string
  description?: ReactNode
  consequences?: ReactNode[]
  note?: ReactNode
  confirmLabel: string
  tone?: "default" | "destructive"
  onConfirm: () => Promise<boolean>
}) {
  const t = useTranslations("common")
  const [innerOpen, setInnerOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const open = controlledOpen ?? innerOpen
  const setOpen = onOpenChange ?? setInnerOpen

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        {consequences && consequences.length > 0 ? (
          <ul
            className={cn(
              "flex list-disc flex-col gap-1 py-4 ps-8 pe-4 text-sm marker:text-muted-foreground",
              tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-muted"
            )}
          >
            {consequences.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        ) : null}
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>
          <Button
            variant={tone === "destructive" ? "destructive" : "default"}
            disabled={pending}
            onClick={async () => {
              if (await whilePending(setPending, onConfirm)) {
                setOpen(false)
              }
            }}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ReasonDialog({
  trigger,
  title,
  description,
  reasonLabel,
  reasonHint,
  placeholder,
  confirmLabel,
  dismissLabel,
  tone = "default",
  onConfirm,
  open: controlledOpen,
  onOpenChange,
  children,
}: Controlled & {
  trigger?: ReactNode
  title: string
  description?: ReactNode
  reasonLabel?: string
  reasonHint?: string
  placeholder?: string
  confirmLabel: string
  dismissLabel?: string
  tone?: "default" | "destructive"
  onConfirm: (reason: string | null) => Promise<boolean>
  children?: ReactNode
}) {
  const t = useTranslations("common")
  const { onCloseAutoFocus } = useDialogMount()
  const [innerOpen, setInnerOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [reason, setReason] = useState("")
  const open = controlledOpen ?? innerOpen

  const setOpen = (next: boolean) => {
    if (pending) {
      return
    }

    if (!next) {
      setReason("")
    }

    ;(onOpenChange ?? setInnerOpen)(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        {children}
        <FormField label={reasonLabel ?? t("reason")} description={reasonHint} optional>
          {(control) => (
            <Textarea
              {...control}
              value={reason}
              maxLength={200}
              placeholder={placeholder}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20"
            />
          )}
        </FormField>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{dismissLabel ?? t("cancel")}</AlertDialogCancel>
          <Button
            variant={tone === "destructive" ? "destructive" : "default"}
            disabled={pending}
            onClick={async () => {
              const close = await whilePending(setPending, () =>
                onConfirm(reason.trim() === "" ? null : reason.trim())
              )

              if (close) {
                setReason("")

                ;(onOpenChange ?? setInnerOpen)(false)
              }
            }}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ReasonProblem({
  mutation,
}: {
  mutation: { problem: { message: string } | null; fieldErrors: Record<string, string> }
}) {
  if (!mutation.problem) {
    return null
  }

  return (
    <p role="alert" className="text-sm text-destructive">
      {mutation.fieldErrors.reason ?? mutation.problem.message}
    </p>
  )
}
