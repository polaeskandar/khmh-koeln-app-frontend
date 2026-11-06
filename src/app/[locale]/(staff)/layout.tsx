import { NavUser } from "@/components/app-shell/account-menu"
import { AppShell } from "@/components/app-shell/app-shell"
import { RequireStaff } from "@/features/auth/guards"

export default function StaffLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <RequireStaff>
      <AppShell footer={<NavUser />}>{children}</AppShell>
    </RequireStaff>
  )
}
