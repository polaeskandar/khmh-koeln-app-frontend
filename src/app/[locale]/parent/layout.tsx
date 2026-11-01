import { RequireParent } from "@/features/auth/guards"
import { ParentShell } from "@/features/parent/parent-shell"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireParent>
      <ParentShell>{children}</ParentShell>
    </RequireParent>
  )
}
