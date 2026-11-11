import type { LucideIcon } from "lucide-react"
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

export function StatusBadge({
  tone,
  icon: Icon,
  live,
  dashed,
  children,
  className,
  title,
}: {
  tone: Tone
  icon?: LucideIcon
  live?: boolean
  dashed?: boolean
  children: React.ReactNode
  className?: string
  title?: string
}) {
  return (
    <Badge
      variant="outline"
      title={title}
      className={cn(toneText[tone], dashed && "border-dashed", className)}
    >
      {live ? <LiveDot /> : Icon ? <Icon data-icon="inline-start" /> : null}
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
