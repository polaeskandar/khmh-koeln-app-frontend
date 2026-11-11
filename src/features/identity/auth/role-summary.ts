import type { Me } from "./api"

export function roleSummary(me: Me, none: string): string {
  const [first, ...more] = me.roles

  if (!first) {
    return none
  }

  return more.length > 0 ? `${first.name} +${more.length}` : first.name
}
