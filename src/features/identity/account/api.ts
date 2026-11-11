import { api, dataOf, type Schemas } from "@/lib/api/client"

export type ChangePassword = Schemas["ChangePasswordRequest"]

export const changePasswordRequest = (input: ChangePassword) =>
  dataOf(api.POST("/me/password", { body: input }))
