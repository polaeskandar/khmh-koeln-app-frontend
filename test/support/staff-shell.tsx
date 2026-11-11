import { http, HttpResponse } from "msw"
import type { ReactNode } from "react"

import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import { StaffShell } from "@/features/portals/staff/staff-shell"
import type { Locale } from "@/i18n/config"

import { apiUrl } from "./api"
import { server } from "./msw"
import { renderWithProviders } from "./providers"

export function renderStaffShell(account: Me, locale: Locale = "en", footer?: ReactNode) {
  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(account)),
    http.get(apiUrl("/attendance/overview"), () =>
      HttpResponse.json({
        today: "2026-11-08",
        sessions: [],
        earlier: [],
        closed: [],
        openCount: 0,
      })
    )
  )

  return renderWithProviders(
    <SessionProvider>
      <StaffShell footer={footer}>
        <p>Page</p>
      </StaffShell>
    </SessionProvider>,
    { locale }
  )
}
