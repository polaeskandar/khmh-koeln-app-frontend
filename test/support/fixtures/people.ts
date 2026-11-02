import type { PeopleList, PersonRow } from "@/features/members/api"

import { thirdClass } from "@test/support/fixtures/stages"

let n = 0

export function person(
  firstName: string,
  lastName: string,
  {
    displayName = null,
    startsOn = "2026-09-06",
  }: { displayName?: string | null; startsOn?: string } = {}
): PersonRow {
  n++

  return {
    person: {
      id: `0192f3a4-7b1c-7d2e-8f3b-${String(n).padStart(12, "0")}`,
      firstName,
      lastName,
      displayName,
      status: "active",
    },
    placements: [
      {
        membershipId: `0192f3a4-7b1c-7d2e-8f3c-${String(n).padStart(12, "0")}`,
        service: thirdClass.service,
        stage: {
          id: thirdClass.id,
          name: thirdClass.name,
          position: thirdClass.position,
          archived: false,
        },
        startsOn,
        endsOn: null,
      },
    ],
    pastPlacements: [],
    can: { edit: true },
  }
}

export const peopleList = (
  items: PersonRow[],
  { page = 1, total = items.length } = {}
): PeopleList => ({
  today: "2026-11-08",
  items,
  page,
  pageSize: 25,
  total,
  can: { add: true },
})
