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
