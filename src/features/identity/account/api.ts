import { api, dataOf, type Schemas } from "@/lib/api/client"

export type PasswordChange = Schemas["ChangePasswordRequest"]

export const changePasswordRequest = (input: PasswordChange) =>
  dataOf(api.POST("/me/password", { body: input }))
