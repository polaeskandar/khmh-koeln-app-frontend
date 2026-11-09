import { cn } from "cn"
import { Eye, LockKeyhole } from "lucide-react"
import { useTranslations } from "next-intl"

export type Audience = "parents" | "servants"

export function VisibilityNote({ who, className }: { who: Audience; className?: string }) {
  const t = useTranslations("lessons.visibility")

  return who === "parents" ? (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-success", className)}
    >
      <Eye className="size-3.5 shrink-0" aria-hidden="true" />
      {t("parents")}
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
      {t("servants")}
    </span>
  )
}

export function LessonPanel({
  title,
  who,
  actions,
  children,
  className,
}: {
  title: string
  who?: Audience
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-4 border p-5",
        who === "servants" && "bg-muted/30",
        who === "parents" && "border-s-4 border-s-success",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold tracking-tight">{title}</h2>
        <div className="flex items-center gap-3">
          {who ? <VisibilityNote who={who} /> : null}
          {actions}
        </div>
      </div>
      {children}
    </section>
  )
}
