import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

const CELL_HEIGHTS = { sm: "h-1.5", md: "h-2.5", lg: "h-4" } as const

function cellTone(index: number, filled: number, total: number) {
  if (index < filled) {
    return "bg-primary"
  }

  return index >= total ? "bg-primary/35" : "bg-muted ring-1 ring-foreground/10 ring-inset"
}

export function RosterCells({
  filled,
  total,
  extra = 0,
  size = "md",
  className,
}: {
  filled: number
  total: number
  extra?: number
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const t = useTranslations("roster")
  const cells = total + extra

  if (cells === 0) {
    return null
  }

  return (
    <div
      className={cn("grid", size === "sm" ? "gap-0.5" : "gap-1", className)}
      style={{
        gridTemplateColumns: `repeat(${Math.max(cells, size === "sm" ? 1 : cells)}, minmax(0, 1fr))`,
      }}
      role="img"
      aria-label={
        extra
          ? t("cellsExtra", { present: filled, total, extra })
          : t("cells", { present: filled, total })
      }
    >
      {Array.from({ length: cells }).map((_, i) => (
        <span key={i} className={cn(CELL_HEIGHTS[size], cellTone(i, filled, total))} />
      ))}
    </div>
  )
}
