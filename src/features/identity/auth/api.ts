import { queryOptions } from "@tanstack/react-query"

import type { Locale } from "@/i18n/config"
import { api, dataOf, type Schemas } from "@/lib/api/client"
import { can } from "@/lib/permissions"
import { ME_KEY, REGISTRATION_SERVICES_KEY } from "@/lib/api/query-keys"

export type Me = Schemas["MeResponse"]

export function areasOf(me: Me) {
  return {
    staff: me.permissions.some((p) => p.resource !== "parentPortal"),
    parent: can(me, "read", "parentPortal"),
    member: me.member !== null,
  }
}

export const meQuery = queryOptions({
  queryKey: ME_KEY,
  queryFn: ({ signal }) => dataOf(api.GET("/me", { signal })),
})

export const saveLanguageRequest = (language: Locale) =>
  dataOf(api.PUT("/me/language", { body: { language } }))

export const signInRequest = (credentials: { email: string; password: string }) =>
  dataOf(api.POST("/auth/sign-in", { body: credentials }))

export const signOutRequest = () => dataOf(api.POST("/auth/sign-out", { body: {} }))

export const MIN_PASSWORD_LENGTH = 10

export type RegisteredAs = Schemas["RegisteredAs"]

export type Registration = Schemas["RegisterAccountRequest"]

export const registrationServicesQuery = queryOptions({
  queryKey: [...REGISTRATION_SERVICES_KEY, "list"],
  queryFn: ({ signal }) => dataOf(api.GET("/auth/register/services", { signal })),
})

export const registerRequest = (body: Registration) => dataOf(api.POST("/auth/register", { body }))

export const confirmEmailRequest = (token: string) =>
  dataOf(api.POST("/auth/email-confirmations", { body: { token } }))

export const setPasswordRequest = (body: Schemas["SetPasswordFromLinkRequest"]) =>
  dataOf(api.POST("/auth/password-links", { body }))

export const forgotPasswordRequest = (email: string) =>
  dataOf(api.POST("/auth/forgot-password", { body: { email } }))

export const cancelErasureRequest = (credentials: Schemas["CancelErasureRequest"]) =>
  dataOf(api.POST("/auth/erasure-cancellation", { body: credentials }))
