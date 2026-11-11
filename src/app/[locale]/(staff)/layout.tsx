import { NavUser } from "@/features/portals/staff/staff-account-menu"
import { StaffShell } from "@/features/portals/staff/staff-shell"
import { RequireStaff } from "@/features/identity/auth/guards"

export default function StaffLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <RequireStaff>
      <StaffShell footer={<NavUser />}>{children}</StaffShell>
    </RequireStaff>
  )
}
