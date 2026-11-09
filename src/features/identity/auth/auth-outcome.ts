export type AuthOutcome = "pending" | "unconfirmed" | "registered"

let last: AuthOutcome | null = null

export function rememberOutcome(outcome: AuthOutcome) {
  last = outcome
}

export function forgetOutcome() {
  last = null
}

export const lastOutcome = () => last
