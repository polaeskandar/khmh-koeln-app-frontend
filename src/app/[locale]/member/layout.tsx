import { RequireMember } from "@/features/auth/guards"
import { MemberShell } from "@/features/member/member-shell"

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireMember>
      <MemberShell>{children}</MemberShell>
    </RequireMember>
  )
}
