import { RequireMember } from "@/features/identity/guards"
import { MemberShell } from "@/features/people/member/member-shell"

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireMember>
      <MemberShell>{children}</MemberShell>
    </RequireMember>
  )
}
