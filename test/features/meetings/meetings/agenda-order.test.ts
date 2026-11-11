import { describe, expect, test } from "vitest"

import {
  agendaSession,
  firstClassStage,
  sundaySchoolRef,
  thirdClassStage,
  youthRef,
} from "@test/support/fixtures/agenda"

import { compareAgenda } from "@/features/meetings/meetings/agenda-order"

describe("compareAgenda", () => {
  test("orders by date and time, then service name, then service-wide before the stages by position", () => {
    const items = [
      agendaSession({ id: "d", service: sundaySchoolRef, stage: thirdClassStage }),
      agendaSession({ id: "e", date: "2026-11-07", service: youthRef, stage: null }),
      agendaSession({ id: "b", service: sundaySchoolRef, stage: firstClassStage }),
      agendaSession({ id: "f", service: youthRef, stage: null }),
      agendaSession({ id: "a", service: sundaySchoolRef, stage: null }),
      agendaSession({ id: "g", startTime: "11:00", service: youthRef, stage: null }),
    ]

    expect([...items].sort(compareAgenda).map((s) => s.id)).toEqual(["e", "g", "a", "b", "d", "f"])
  })
})
