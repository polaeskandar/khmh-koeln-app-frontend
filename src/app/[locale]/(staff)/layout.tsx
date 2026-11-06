import { RequireStaff } from "@/features/auth/guards"

export default function StaffLayout({ children }: LayoutProps<"/[locale]">) {
  return <RequireStaff>{children}</RequireStaff>
}
