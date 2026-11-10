import { http, HttpResponse } from "msw"

import { apiUrl } from "@test/support/api"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"

const today = "2026-11-08"

export function answerSettingsLists() {
  server.use(
    http.get(apiUrl("/account-requests"), () => HttpResponse.json({ items: [], roles: [], today })),
    http.get(apiUrl("/staff-accounts"), () => HttpResponse.json({ items: [], today })),
    http.get(apiUrl("/member-accounts"), () => HttpResponse.json({ items: [], today })),
    http.get(apiUrl("/guardian-links"), () =>
      HttpResponse.json({ items: [], accounts: [], today })
    ),
    http.get(apiUrl("/roles"), () => HttpResponse.json({ items: [] })),
    http.get(apiUrl("/services"), () => HttpResponse.json(services))
  )
}
