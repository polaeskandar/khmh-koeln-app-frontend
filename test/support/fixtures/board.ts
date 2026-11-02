import type { AttendanceBoard, Mark } from "@/features/attendance/api"
import type { PersonRef } from "@/lib/api/types/common"

import { session, stageRef, sundaySchool } from "@test/support/fixtures/sessions"

const person = (
  n: number,
  firstName: string,
  lastName: string,
  displayName: string | null = null
): PersonRef => ({
  id: `0192f3a4-7b1c-7d2e-8f40-${String(n).padStart(12, "0")}`,
  firstName,
  lastName,
  displayName,
})

const mark = (n: number, time: string): Mark => ({
  id: `0192f3a4-7b1c-7d2e-8f41-${String(n).padStart(12, "0")}`,
  recordedAt: `2026-11-08T${time}:00+01:00`,
  recordedBy: { id: "a1", name: "Daniel Mikhail" },
})

const NAMES: [string, string, string | null][] = [
  ["Anna", "Fanous", null],
  ["Ramy", "Fanous", null],
  ["Marina", "Gerges", null],
  ["Kirollos", "Iskander", "Kiro"],
  ["Mina", "Hanna", null],
  ["Youssef", "Hanna", null],
  ["Sara", "Khalil", null],
  ["Demiana", "Labib", null],
  ["Abanoub", "Malak", null],
  ["Mariam", "Nasr", null],
  ["Philopater", "Rizk", null],
  ["Veronia", "Saad", null],
  ["Bishoy", "Tawfik", null],
  ["Karen", "Wahba", null],
]

export const rosterPeople = NAMES.map(([first, last, display], i) =>
  person(i + 1, first, last, display)
)

export const visitor = person(99, "Theo", "Mansour")

export const thirdClassBoard = (): AttendanceBoard => ({
  today: "2026-11-08",
  session: session({
    status: "active",
    counts: { present: 8, rosterSize: 14, rosterPresent: 7, notMarked: 7, notOnRoster: 1 },
  }),
  counts: { present: 8, rosterSize: 14, rosterPresent: 7, notMarked: 7, notOnRoster: 1 },
  roster: rosterPeople.map((p, i) => ({
    person: p,
    mark: i % 2 === 0 ? mark(i, `12:${String(10 + i).padStart(2, "0")}`) : null,
  })),
  notOnRoster: [
    {
      person: visitor,
      mark: mark(99, "12:30"),
      placements: [
        {
          service: {
            ...sundaySchool,
            id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f11",
            name: "Youth Meeting",
            tone: 2,
          },
          stage: null,
        },
      ],
    },
  ],
  recentlyMarked: [],
  corrections: [],
  history: [],
})

export const openRosterBoard = (): AttendanceBoard => ({
  ...thirdClassBoard(),
  session: session({ status: "active", stage: stageRef("Bible study", 0), rosterMode: "open" }),
  counts: { present: 2, rosterSize: null, rosterPresent: 0, notMarked: 0, notOnRoster: 2 },
  roster: [],
  notOnRoster: [
    { person: rosterPeople[0], mark: mark(1, "19:35"), placements: [] },
    { person: visitor, mark: mark(99, "19:40"), placements: [] },
  ],
})

const christine = { id: "a3", name: "Christine Adel" }

export const closedFirstNovember = (): AttendanceBoard => {
  const board = thirdClassBoard()
  const at = (time: string) => `2026-11-01T${time}:00+01:00`

  return {
    ...board,
    session: session({
      date: "2026-11-01",
      status: "completed",
      closedAt: at("13:48"),
      closedBy: christine,
      can: { manage: true, record: true, reopen: true },
      counts: { present: 11, rosterSize: 14, rosterPresent: 11, notMarked: 3, notOnRoster: 0 },
    }),
    counts: { present: 11, rosterSize: 14, rosterPresent: 11, notMarked: 3, notOnRoster: 0 },
    roster: rosterPeople.map((p, i) => ({
      person: p,
      mark:
        i < 11
          ? {
              id: `m${i}`,
              recordedAt: at(`12:${String(10 + i).padStart(2, "0")}`),
              recordedBy: christine,
            }
          : null,
    })),
    notOnRoster: [],
    corrections: [
      {
        id: "c1",
        person: rosterPeople[4],
        recordedAt: at("12:04"),
        recordedBy: christine,
        removedAt: at("13:46"),
        removedBy: christine,
        reason: "Tapped the wrong name",
      },
    ],
    history: [
      {
        type: "created",
        at: "2026-10-31T12:00:00+01:00",
        actor: null,
        byGenerator: true,
        note: null,
      },
      { type: "opened", at: at("12:00"), actor: christine, byGenerator: false, note: null },
      { type: "closed", at: at("13:30"), actor: christine, byGenerator: false, note: null },
      {
        type: "reopened",
        at: at("13:40"),
        actor: christine,
        byGenerator: false,
        note: "Mina was not here",
      },
      { type: "closed", at: at("13:48"), actor: christine, byGenerator: false, note: null },
    ],
  }
}
