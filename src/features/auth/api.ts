import { api, dataOf, type Schemas } from "@/lib/api/client"
import { can } from "@/lib/permissions"

export type Me = Schemas["CurrentAccount"]

export function areasOf(me: Me) {
  return {
    staff: me.permissions.some((p) => p.resource !== "parentPortal"),
    parent: can(me, "read", "parentPortal"),
    administrator: can(me, "update", "roles"),
  }
}

export const meQuery = {
  queryKey: ["me"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/me", { signal })),
}

export const signInRequest = (credentials: { email: string; password: string }) =>
  dataOf(api.POST("/auth/sign-in", { body: credentials }))

export const signOutRequest = () => dataOf(api.POST("/auth/sign-out", { body: {} }))

export const MIN_PASSWORD_LENGTH = 10

export const setPasswordRequest = (body: { token: string; password: string }) =>
  dataOf(api.POST("/auth/password-links", { body }))
