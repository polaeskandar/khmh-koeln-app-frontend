import { unusedMessageKeys } from "./message-usage.mjs"

const unused = await unusedMessageKeys()

console.log(
  unused.length === 0
    ? "Every message key is used."
    : `${unused.length} message keys in messages/en.json look unused:\n${unused.join("\n")}`
)
