import { useId } from "react"
import { cn } from "cn"

import { OptionalNote } from "@/components/form-fields"

export function FormPanel({
  title,
  optional = false,
  note,
  children,
  className,
}: {
  title: string
  optional?: boolean
  note?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const id = useId()

  return (
    <div
      role="group"
      aria-labelledby={id}
      className={cn("flex min-w-0 flex-col gap-5 border p-5", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="text-xs font-semibold tracking-wider uppercase">
          {title}
          {optional ? <OptionalNote /> : null}
        </h2>
        {note}
      </div>
      {children}
    </div>
  )
}
