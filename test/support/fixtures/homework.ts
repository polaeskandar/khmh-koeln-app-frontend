import type { HomeworkFlags, HomeworkRow, StageHomework } from "@/features/learning/homework/api"

import { goodSamaritan, lessonStage } from "@test/support/fixtures/lessons"

export const homeworkFlags = (can: Partial<HomeworkFlags> = {}): HomeworkFlags => ({
  edit: false,
  publish: false,
  viewProgress: false,
  unpublish: false,
  archive: false,
  restore: false,
  delete: false,
  ...can,
})

export const homeworkRow = (overrides: Partial<HomeworkRow> = {}): HomeworkRow => ({
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea001",
  title: "Learn the memory verse",
  status: "draft",
  dueDate: null,
  publishedAt: null,
  lesson: {
    id: goodSamaritan.id,
    title: goodSamaritan.title,
    teachingDate: goodSamaritan.teachingDate,
    archived: false,
  },
  counts: null,
  ...overrides,
})

export const stageHomework = (overrides: Partial<StageHomework> = {}): StageHomework => ({
  today: "2026-11-08",
  stage: lessonStage,
  archived: false,
  tabs: { published: 0, draft: 0, archived: 0 },
  lessons: [],
  defaultLessonId: null,
  audienceSize: 14,
  items: [],
  ...overrides,
})
