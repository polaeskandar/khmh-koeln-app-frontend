import { cn } from "cn"

const CROSS =
  "M4 1h1v3h3v1h-3v3h-1v-3h-3v-1h3z" + "M3 0h3v1h-3z M3 8h3v1h-3z M0 3h1v3h-1z M8 3h1v3h-1z"

function CopticCross({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 9 9" className={className} aria-hidden="true" shapeRendering="crispEdges">
      <path d={CROSS} fill="currentColor" />
    </svg>
  )
}

export function KhmkMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center bg-primary text-primary-foreground",
        className
      )}
    >
      <CopticCross className="size-[55%]" />
    </span>
  )
}
