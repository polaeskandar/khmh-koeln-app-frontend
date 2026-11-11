import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"

export type Tone = "success" | "info" | "warning" | "danger" | "neutral" | "muted"

const toneText: Record<Tone, string> = {
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
  danger: "text-destructive",
  neutral: "text-foreground",
  muted: "text-muted-foreground",
}

type BadgeVariant = "default" | "live" | "dashed"

function BadgeMark({ variant, icon: Icon }: { variant: BadgeVariant; icon?: LucideIcon }) {
  if (variant === "live") {
    return <LiveDot />
  }

  return Icon ? <Icon data-icon="inline-start" /> : null
}

export function StatusBadge({
  tone,
  icon,
  variant = "default",
  children,
  className,
  title,
}: {
  tone: Tone
  icon?: LucideIcon
  variant?: BadgeVariant
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <Badge
      variant="outline"
      title={title}
      className={cn(toneText[tone], variant === "dashed" && "border-dashed", className)}
    >
      <BadgeMark variant={variant} icon={icon} />
      {children}
    </Badge>
  )
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex size-2 shrink-0", className)} aria-hidden="true">
      <span className="absolute inline-flex size-full animate-live bg-current opacity-60" />
      <span className="relative inline-flex size-2 bg-current" />
    </span>
  )
}
