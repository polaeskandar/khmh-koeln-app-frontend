import { cn } from "cn"

import type { ServiceRef } from "@/lib/api/types/common"

export const toneOf = (tone: number | null | undefined) =>
  typeof tone === "number" && Number.isInteger(tone) && tone >= 1 && tone <= 8 ? tone : 1

export function ServiceSwatch({ tone, className }: { tone?: number | null; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2 shrink-0", className)}
      style={{ background: `var(--identity-${toneOf(tone)})` }}
    />
  )
}

export function ServiceTag({
  service,
  label,
  className,
}: {
  service: Pick<ServiceRef, "name" | "tone">
  label?: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-1.5 text-muted-foreground", className)}
    >
      <ServiceSwatch tone={service.tone} />
      <span className="truncate">{label ?? service.name}</span>
    </span>
  )
}
