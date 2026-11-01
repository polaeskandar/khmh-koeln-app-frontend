import { RequireParent } from "@/features/auth/guards"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <RequireParent>{children}</RequireParent>
}
