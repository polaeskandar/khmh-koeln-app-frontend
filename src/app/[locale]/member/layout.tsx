import { RequireMember } from "@/features/identity/auth/guards"
import { MemberShell } from "@/features/portals/member/member-shell"

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireMember>
      <MemberShell>{children}</MemberShell>
    </RequireMember>
  )
}
