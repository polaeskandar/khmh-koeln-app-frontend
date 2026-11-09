import { api, apiDownload } from "@/lib/api/client"

export const downloadDataCopy = (token: string) =>
  apiDownload(api.POST("/data-copies", { body: { token }, parseAs: "blob" }), "khmk-my-data.json")
