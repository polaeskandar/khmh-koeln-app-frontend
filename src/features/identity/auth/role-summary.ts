import type { Me } from "./api"

export function roleSummary(me: Me, none: string): string {
  const [first, ...more] = me.roles

  if (!first) {
    return none
  }

  return more.length > 0 ? `${first.name} +${more.length}` : first.name
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]?.charAt(0) ?? ""
  const last = words.length > 1 ? (words.at(-1)?.charAt(0) ?? "") : ""

  return `${first}${last}`.toLocaleUpperCase("de-DE")
}
