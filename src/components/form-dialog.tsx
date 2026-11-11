"use client"

import type { LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode, RefObject } from "react"

import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useDialogMount } from "@/components/dialog-mount"
import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"

type FormDialogProps = {
  title: ReactNode
  description: ReactNode
  icon?: LucideIcon
  role?: "dialog" | "alertdialog"
  size?: "default" | "wide"
  pending: boolean
  problem: unknown
  submitLabel: string
  submitDisabled?: boolean
  submitOnEnter?: boolean
  tone?: "default" | "destructive"
  onSubmit: () => unknown
  onClose: () => void
  children: ReactNode
}

type Layout = {
  content: string
  header?: string
  form: string
  body: string
  footer?: string
}

const LAYOUTS: Record<"default" | "wide", Layout> = {
  default: {
    content: "max-h-[calc(100dvh-2rem)] overflow-y-auto",
    form: "flex flex-col gap-6",
    body: "flex flex-col gap-6",
  },
  wide: {
    content: "flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-4xl",
    header: "border-b p-6 pe-16",
    form: "flex min-h-0 flex-1 flex-col",
    body: "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6",
    footer: "border-t px-6 py-4",
  },
}

function DialogForm({
  formRef,
  layout,
  footer,
  pending,
  submitLabel,
  submitDisabled,
  submitOnEnter,
  tone,
  onSubmit,
  cancel,
  children,
}: {
  formRef: RefObject<HTMLFormElement | null>
  layout: Layout
  footer: typeof DialogFooter
  pending: boolean
  submitLabel: string
  submitDisabled: boolean
  submitOnEnter: boolean
  tone: "default" | "destructive"
  onSubmit: () => unknown
  cancel: ReactNode
  children: ReactNode
}) {
  const Footer = footer

  function submitWhenReady() {
    if (!pending && !submitDisabled) {
      void onSubmit()
    }
  }

  return (
    <form
      ref={formRef}
      noValidate
      className={layout.form}
      onSubmit={(event) => {
        event.preventDefault()

        if (submitOnEnter) {
          submitWhenReady()
        }
      }}
    >
      <div className={layout.body}>{children}</div>
      <Footer className={layout.footer}>
        {cancel}
        <Button
          type={submitOnEnter ? "submit" : "button"}
          variant={tone === "destructive" ? "destructive" : "default"}
          disabled={pending || submitDisabled}
          onClick={submitOnEnter ? undefined : submitWhenReady}
        >
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {submitLabel}
        </Button>
      </Footer>
    </form>
  )
}

export function FormDialog({
  title,
  description,
  icon: Icon,
  role = "dialog",
  size = "default",
  pending,
  problem,
  submitLabel,
  submitDisabled = false,
  submitOnEnter = true,
  tone = "default",
  onSubmit,
  onClose,
  children,
}: FormDialogProps) {
  const t = useTranslations("common")
  const mount = useDialogMount()
  const formRef = useFocusFirstInvalid(problem)
  const layout = LAYOUTS[size]

  function changeOpen(open: boolean) {
    if (!open && !pending) {
      onClose()
    }
  }

  const form = {
    formRef,
    layout,
    pending,
    submitLabel,
    submitDisabled,
    submitOnEnter,
    tone,
    onSubmit,
    children,
  }

  if (role === "alertdialog") {
    return (
      <AlertDialog open={mount.open} onOpenChange={changeOpen}>
        <AlertDialogContent className={layout.content} onCloseAutoFocus={mount.onCloseAutoFocus}>
          <AlertDialogHeader className={layout.header}>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <DialogForm
            {...form}
            footer={AlertDialogFooter}
            cancel={<AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>}
          />
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Dialog open={mount.open} onOpenChange={changeOpen}>
      <DialogContent className={layout.content} onCloseAutoFocus={mount.onCloseAutoFocus}>
        <DialogHeader className={layout.header}>
          <DialogTitle className={cn(Icon && "flex items-center gap-2")}>
            {Icon ? <Icon className="size-4" /> : null}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogForm
          {...form}
          footer={DialogFooter}
          cancel={
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
              {t("cancel")}
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
