import type { LocalDate } from "@/lib/api/types/common"

export type AuthOutcome = "pending" | "unconfirmed" | "registered" | "erasureScheduled"

let last: AuthOutcome | null = null
let erasesOn: LocalDate | null = null

export function rememberOutcome(outcome: Exclude<AuthOutcome, "erasureScheduled">) {
  last = outcome
  erasesOn = null
}

export function rememberErasureScheduled(on: LocalDate) {
  last = "erasureScheduled"
  erasesOn = on
}

export function forgetOutcome() {
  last = null
  erasesOn = null
}

export const lastOutcome = () => last

export const scheduledErasureOn = () => (last === "erasureScheduled" ? erasesOn : null)
