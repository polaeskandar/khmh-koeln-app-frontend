"use client"

import { useTranslations } from "next-intl"

import { KhmkMark } from "@/components/brand/logo"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { useCan } from "@/features/identity/auth/session"
import { useInlineEnd } from "@/i18n/direction"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import { TAKE_ATTENDANCE } from "./staff-nav"

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
