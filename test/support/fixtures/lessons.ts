import type {
  Lesson,
  LessonDetail,
  LessonOptions,
  StageLessons,
} from "@/features/learning/lessons/api"

import { thirdClass } from "@test/support/fixtures/stages"

export const lessonService = thirdClass.service

export const lessonStage = {
  id: thirdClass.id,
  name: thirdClass.name,
  position: 2,
  archived: false,
}

export const goodSamaritan: Lesson = {
  id: "0192f3a4-7b1c-7d2e-8f80-000000000001",
  title: "The Good Samaritan",
  passage: "Luke 10:25–37",
  teachingDate: "2026-11-15",
  status: "draft",
  responsible: { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f01", name: "Mariam Fahmy" },
  collaborators: [],
  meeting: { kind: "none", date: "2026-11-15" },
  scheduleId: null,
  summary: null,
  memoryVerse: null,
  objectives: null,
  teachingPoints: null,
  activities: null,
  materials: [],
  notes: null,
  completedAt: null,
  archivedAt: null,
  version: 1,
}

export const lessonDetail = (
  lesson: Partial<Lesson> = {},
  can: Partial<LessonDetail["can"]> = {}
): LessonDetail => ({
  service: lessonService,
  stage: lessonStage,
  today: "2026-11-08",
  lesson: { ...goodSamaritan, ...lesson },
  homework: { total: 0, published: 0, drafts: 0 },
  can: {
    manage: true,
    markCompleted: false,
    manageHomework: true,
    viewNotes: true,
    archive: false,
    restore: false,
    delete: false,
    ...can,
  },
})

export const stageLessons = (overrides: Partial<StageLessons> = {}): StageLessons => ({
  service: lessonService,
  stage: lessonStage,
  today: "2026-11-08",
  tabs: { upcoming: 0, previous: 0, archived: 0 },
  servants: [],
  can: { create: true },
  items: [],
  ...overrides,
})

const SCHEDULE_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f90"

export const daniel = { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f01", name: "Mariam Fahmy" }

export const lessonOptions = (overrides: Partial<LessonOptions> = {}): LessonOptions => ({
  today: "2026-11-08",
  options: [
    {
      scheduleId: SCHEDULE_ID,
      date: "2026-11-01",
      startTime: "12:00",
      title: "Sunday class",
      state: "completed",
      takenBy: null,
    },
    {
      scheduleId: SCHEDULE_ID,
      date: "2026-11-08",
      startTime: "12:00",
      title: "Sunday class",
      state: "active",
      takenBy: null,
    },
    {
      scheduleId: SCHEDULE_ID,
      date: "2026-11-15",
      startTime: "12:00",
      title: "Sunday class",
      state: "planned",
      takenBy: { id: goodSamaritan.id, title: "The Good Samaritan" },
    },
    {
      scheduleId: SCHEDULE_ID,
      date: "2026-11-22",
      startTime: "12:00",
      title: "Sunday class",
      state: "planned",
      takenBy: null,
    },
    {
      scheduleId: SCHEDULE_ID,
      date: "2026-11-29",
      startTime: "12:00",
      title: "Sunday class",
      state: "canceled",
      takenBy: null,
    },
  ],
  servants: [daniel, { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f02", name: "Bishoy Tadros" }],
  ...overrides,
})
