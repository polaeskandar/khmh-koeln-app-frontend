import {
  CalendarDays,
  ClipboardCheck,
  Layers,
  type LucideIcon,
  Settings,
  UsersRound,
} from "lucide-react"

import type { areasOf } from "@/features/auth/api"
import { registrationEnabled } from "@/lib/env"
import { routes } from "@/lib/routes"

export type NavKey = "services" | "meetings" | "attendance" | "members" | "settings"
export type NavItem = { href: string; key: NavKey; icon: LucideIcon }

export const NAV: NavItem[] = [
  { href: routes.services(), key: "services", icon: Layers },
  { href: routes.meetings(), key: "meetings", icon: CalendarDays },
  { href: routes.attendance(), key: "attendance", icon: ClipboardCheck },
  { href: routes.members(), key: "members", icon: UsersRound },
]

export const TAKE_ATTENDANCE = { href: routes.attendance(), icon: ClipboardCheck }

export const SETTINGS: NavItem = { href: routes.settings(), key: "settings", icon: Settings }

export const showsSettings = (areas: ReturnType<typeof areasOf>) =>
  areas.administrator && registrationEnabled()

const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path)

export function isActive(href: string, pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false
  }

  const item = trimSlash(href)
  const path = trimSlash(pathname.split("?")[0])

  return item === "/" ? path === "/" : path === item || path.startsWith(`${item}/`)
}
