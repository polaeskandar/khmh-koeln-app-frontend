"use client"

import type { ReactNode } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useDirection } from "@/i18n/direction"

import { MobileTabBar } from "./mobile-tab-bar"
import { SidebarBrand } from "./sidebar-brand"
import { SidebarNav } from "./sidebar-nav"

export function StaffShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const dir = useDirection()

  return (
    <SidebarProvider className="min-h-svh">
      <Sidebar collapsible="icon" side={dir === "rtl" ? "right" : "left"} dir={dir}>
        <SidebarHeader>
          <SidebarBrand />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </SidebarInset>
      <MobileTabBar />
    </SidebarProvider>
  )
}
