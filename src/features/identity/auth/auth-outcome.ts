import type { LocalDate } from "@/lib/api/types/common"

export type AuthOutcome = "pending" | "unconfirmed" | "registered" | "erasureScheduled"

type Stored = { outcome: AuthOutcome; erasesOn: LocalDate | null }

const KEY = "khmk.authOutcome"

const OUTCOMES: readonly AuthOutcome[] = [
  "pending",
  "unconfirmed",
  "registered",
  "erasureScheduled",
]

let inMemory: Stored | null = null

function isStored(value: unknown): value is Stored {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const { outcome, erasesOn } = value as Record<string, unknown>

  return (
    OUTCOMES.includes(outcome as AuthOutcome) && (erasesOn === null || typeof erasesOn === "string")
  )
}

function read(): Stored | null {
  try {
    const raw = window.sessionStorage.getItem(KEY)

    if (raw === null) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)

    return isStored(parsed) ? parsed : null
  } catch {
    return inMemory
  }
}

function write(stored: Stored | null) {
  inMemory = stored

  try {
    if (stored === null) {
      window.sessionStorage.removeItem(KEY)
    } else {
      window.sessionStorage.setItem(KEY, JSON.stringify(stored))
    }
  } catch {}
}

export function rememberOutcome(outcome: Exclude<AuthOutcome, "erasureScheduled">) {
  write({ outcome, erasesOn: null })
}

export function rememberErasureScheduled(on: LocalDate) {
  write({ outcome: "erasureScheduled", erasesOn: on })
}

export function forgetOutcome() {
  write(null)
}

export const lastOutcome = () => read()?.outcome ?? null

export const scheduledErasureOn = () => {
  const stored = read()

  return stored?.outcome === "erasureScheduled" ? stored.erasesOn : null
}
