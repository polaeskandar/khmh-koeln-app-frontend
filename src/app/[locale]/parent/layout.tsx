import { RequireParent } from "@/features/identity/guards"
import { ParentShell } from "@/features/people/parent/parent-shell"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireParent>
      <ParentShell>{children}</ParentShell>
    </RequireParent>
  )
}
