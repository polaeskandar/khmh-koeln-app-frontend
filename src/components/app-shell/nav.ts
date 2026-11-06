import {
  CalendarDays,
  ClipboardCheck,
  Layers,
  type LucideIcon,
  Settings,
  UsersRound,
} from "lucide-react"

import type { Can } from "@/lib/permissions"
import { routes } from "@/lib/routes"

export type NavKey = "services" | "meetings" | "attendance" | "members" | "settings"

export type NavItem = {
  href: string
  key: NavKey
  icon: LucideIcon
  allowed: (can: Can) => boolean
}

const always = () => true

export const NAV: NavItem[] = [
  { href: routes.services(), key: "services", icon: Layers, allowed: always },
  { href: routes.meetings(), key: "meetings", icon: CalendarDays, allowed: always },
  {
    href: routes.attendance(),
    key: "attendance",
    icon: ClipboardCheck,
    allowed: (can) => can("read", "attendance") || can("create", "attendance"),
  },
  {
    href: routes.members(),
    key: "members",
    icon: UsersRound,
    allowed: (can) => can("read", "members"),
  },
]

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

const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path)

export function isActive(href: string, pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false
  }

  const item = trimSlash(href)
  const path = trimSlash(pathname.split("?")[0])

  return item === "/" ? path === "/" : path === item || path.startsWith(`${item}/`)
}
