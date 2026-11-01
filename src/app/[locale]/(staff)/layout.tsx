import { AppShell } from "@/components/app-shell/app-shell"
import { RequireStaff } from "@/features/auth/guards"

export default function StaffLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <RequireStaff>
      <AppShell>{children}</AppShell>
    </RequireStaff>
  )
}
