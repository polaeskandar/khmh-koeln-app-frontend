import type { PersonRef } from "@/lib/api/types/common"

type Person = Pick<PersonRef, "firstName" | "lastName" | "displayName">

export function cleanName(value: string): string {
  return value.replace(/\s+/gu, " ").trim()
}

export function nameKey(value: string): string {
  return cleanName(value).toLocaleLowerCase("de-DE")
}

export function fullName(p: Pick<Person, "firstName" | "lastName">): string {
  return `${p.firstName} ${p.lastName}`
}

export function preferredName(p: Pick<Person, "firstName" | "lastName" | "displayName">): string {
  return p.displayName ? `${p.displayName} ${p.lastName}` : fullName(p)
}

export function initials(p: Pick<Person, "firstName" | "lastName" | "displayName">): string {
  const first = (p.displayName ?? p.firstName).trim()

  return `${first.charAt(0)}${p.lastName.trim().charAt(0)}`.toLocaleUpperCase("de-DE")
}

export function matchesQuery(
  p: Pick<Person, "firstName" | "lastName" | "displayName">,
  query: string
): boolean {
  const words = fold(query).split(" ").filter(Boolean)

  if (words.length === 0) {
    return true
  }

  const haystack = fold(`${p.firstName} ${p.lastName} ${p.displayName ?? ""}`)

  return words.every((w) => haystack.includes(w))
}

export function fold(value: string): string {
  return cleanName(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("de-DE")
}
