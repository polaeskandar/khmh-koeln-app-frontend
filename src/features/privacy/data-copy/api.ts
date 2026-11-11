import { api, apiDownload } from "@/lib/api/client"

export const DATA_COPY_FILE = "khmk-my-data.json"

export const downloadDataCopyRequest = (token: string) =>
  apiDownload(api.POST("/data-copies", { body: { token }, parseAs: "blob" }), DATA_COPY_FILE)
