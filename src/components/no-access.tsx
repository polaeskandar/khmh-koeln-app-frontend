import { LockKeyhole } from "lucide-react"
import type { ReactNode } from "react"

import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function NoAccess({
  title,
  children,
  back,
}: {
  title: string
  children: ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LockKeyhole />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{children}</EmptyDescription>
      </EmptyHeader>
      {back ? (
        <EmptyContent>
          <Button variant="outline" size="sm" asChild>
            <Link href={back.href}>{back.label}</Link>
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
