"use client"

import { useTranslations } from "next-intl"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useCan } from "@/features/identity/auth/session"
import { useInlineEnd } from "@/i18n/direction"
import { OpenSessionsBadge } from "@/features/meetings/attendance/open-sessions-badge"
import { Link, usePathname } from "@/i18n/navigation"

import { isActive, NAV, SETTINGS } from "./staff-nav"

export function SidebarNav() {
  const t = useTranslations("nav")
  const side = useInlineEnd()
  const pathname = usePathname()
  const can = useCan()
  const settings = SETTINGS.allowed(can)

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {NAV.filter((item) => item.allowed(can)).map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  asChild
                  tooltip={{ children: t(item.key), side }}
                  isActive={isActive(item.href, pathname)}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{t(item.key)}</span>
                  </Link>
                </SidebarMenuButton>
                {item.key === "attendance" ? <OpenSessionsBadge /> : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {settings ? (
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={{ children: t(SETTINGS.key), side }}
                  isActive={isActive(SETTINGS.href, pathname)}
                >
                  <Link href={SETTINGS.href}>
                    <SETTINGS.icon />
                    <span>{t(SETTINGS.key)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}
    </>
  )
}
