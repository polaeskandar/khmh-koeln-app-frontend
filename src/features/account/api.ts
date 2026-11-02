import { api, dataOf } from "@/lib/api/client"

export type PasswordChange = { currentPassword: string; newPassword: string }

export const MIN_PASSWORD_LENGTH = 10

export const changePasswordRequest = (input: PasswordChange) =>
  dataOf(api.POST("/me/password", { body: input }))
