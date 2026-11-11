import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  Layers,
  type LucideIcon,
  Settings,
  UsersRound,
} from "lucide-react"

import type { Can } from "@/lib/permissions"
import { routes } from "@/lib/routes"

type NavKey = "dashboard" | "services" | "meetings" | "attendance" | "members"

export type NavItem = {
  href: string
  key: NavKey | "settings"
  icon: LucideIcon
  allowed: (can: Can) => boolean
}

const always = () => true

export const NAV = {
  dashboard: { href: routes.home(), key: "dashboard", icon: LayoutDashboard, allowed: always },
  services: { href: routes.services(), key: "services", icon: Layers, allowed: always },
  meetings: { href: routes.meetings(), key: "meetings", icon: CalendarDays, allowed: always },
  attendance: {
    href: routes.attendance(),
    key: "attendance",
    icon: ClipboardCheck,
    allowed: (can) => can("read", "attendance") || can("create", "attendance"),
  },
  members: {
    href: routes.members(),
    key: "members",
    icon: UsersRound,
    allowed: (can) => can("read", "members"),
  },
} satisfies { [K in NavKey]: NavItem & { key: K } }

export const TAKE_ATTENDANCE = {
  href: routes.attendance(),
  icon: ClipboardCheck,
  allowed: (can: Can) => can("create", "attendance"),
}

export const SETTINGS: NavItem = {
  href: routes.settings(),
  key: "settings",
  icon: Settings,
  allowed: (can) => can("read", "users") || can("read", "roles") || can("delete", "users"),
}
