import { RequireParent } from "@/features/identity/auth/guards"
import type { ReactNode } from "react"
import { ParentShell } from "@/features/portals/parent/parent-shell"

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <RequireParent>
      <ParentShell>{children}</ParentShell>
    </RequireParent>
  )
}
