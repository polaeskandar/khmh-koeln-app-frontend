export const PRIVACY_NOTICE_VERSION = "2026-11"

export type PrivacyBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }

export type PrivacyNotice = {
  version: string
  status: "draft" | "final"
  blocks: PrivacyBlock[]
}

const unwrap = (text: string) => text.replace(/\s*\n\s*/g, " ").trim()

function blockOf(chunk: string): PrivacyBlock {
  if (chunk.startsWith("## ")) {
    return { kind: "heading", text: unwrap(chunk.slice(3)) }
  }

  if (chunk.startsWith("- ")) {
    return { kind: "list", items: chunk.split(/\n(?=- )/).map((item) => unwrap(item.slice(2))) }
  }

  return { kind: "paragraph", text: unwrap(chunk) }
}

export function parsePrivacyNotice(source: string): PrivacyNotice {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source.replace(/\r\n/g, "\n"))

  if (!match) {
    throw new Error("A privacy notice starts with front matter: version and status.")
  }

  const meta = new Map(
    match[1].split("\n").map((line) => {
      const [key, ...value] = line.split(":")

      return [key.trim(), value.join(":").trim()] as const
    })
  )

  const version = meta.get("version")
  const status = meta.get("status")

  if (version !== PRIVACY_NOTICE_VERSION) {
    throw new Error(
      `The privacy notice is version ${version}, but the app sends ${PRIVACY_NOTICE_VERSION}.`
    )
  }

  if (status !== "draft" && status !== "final") {
    throw new Error(`A privacy notice's status is draft or final, not ${status}.`)
  }

  const body = match[2].trim()
  const placeholder = /\[[^\]]+\]/.exec(body)

  if (status === "final" && placeholder) {
    throw new Error(`A final privacy notice still has the placeholder ${placeholder[0]}.`)
  }

  return { version, status, blocks: body.split(/\n{2,}/).map(blockOf) }
}
