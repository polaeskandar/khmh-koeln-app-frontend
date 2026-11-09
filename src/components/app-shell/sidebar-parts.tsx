"use client"

import { useTranslations } from "next-intl"

import { KhmkMark } from "@/components/brand/logo"
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
import { routes } from "@/lib/routes"

import { isActive, NAV, SETTINGS, TAKE_ATTENDANCE } from "./nav"

export function SidebarBrand() {
  const t = useTranslations()
  const side = useInlineEnd()
  const can = useCan()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
          <Link href={routes.home()}>
            <KhmkMark />
            <div className="grid flex-1 text-start leading-tight">
              <span className="truncate font-heading text-[15px] font-semibold tracking-tight">
                KHMK Köln
              </span>
              <span className="truncate text-xs text-muted-foreground">{t("brand.church")}</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {TAKE_ATTENDANCE.allowed(can) ? (
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={{ children: t("nav.takeAttendance"), side }}
            className="h-10 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
          >
            <Link href={TAKE_ATTENDANCE.href}>
              <TAKE_ATTENDANCE.icon />
              <span className="font-semibold">{t("nav.takeAttendance")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : null}
    </SidebarMenu>
  )
}

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
