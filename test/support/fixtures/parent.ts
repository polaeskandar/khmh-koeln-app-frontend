import type { ChildSummary } from "@/features/people/children/api"
import type { ParentTask } from "@/features/learning/homework/api"

export const MIMI_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec001"
export const MINA_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec002"

export const mimi: ChildSummary = {
  id: MIMI_ID,
  name: "Mimi",
  fullName: "Mimi Farag",
  initials: "MF",
  stage: "1st Class",
  service: "Sunday School",
  toDo: 1,
  done: 0,
}

export const mina: ChildSummary = {
  id: MINA_ID,
  name: "Mina",
  fullName: "Mina Farag",
  initials: "MF",
  stage: "3rd Class",
  service: "Sunday School",
  toDo: 3,
  done: 6,
}

let seq = 0

export const task = (title: string, extra: Partial<ParentTask> = {}): ParentTask => ({
  id: `0192f3a4-7b1c-7d2e-8f3a-${String(0xd000 + ++seq).padStart(12, "0")}`,
  title,
  lessonTitle: "The Good Shepherd",
  stage: "3rd Class",
  dueDate: "2026-11-08",
  done: false,
  completedAt: null,
  completedByYou: false,
  completedBy: null,
  ...extra,
})

const done = (title: string, completedAt: string, extra: Partial<ParentTask> = {}) =>
  task(title, { done: true, completedAt, ...extra })

export const homeworkOf = {
  [MIMI_ID]: {
    todo: [task("Colour the ark", { lessonTitle: "Noah’s Ark", stage: "1st Class" })],
    done: [],
  },
  [MINA_ID]: {
    todo: [
      task("Draw the shepherd and his sheep"),
      task("Learn the memory verse", { dueDate: "2026-11-22" }),
      task("Pray together", { dueDate: null }),
    ],
    done: [
      done("Read the story", "2026-11-08T10:10:00Z", { completedByYou: true }),
      done("Sing the hymn", "2026-11-07T17:20:00Z", { completedBy: "Nabil Hanna" }),
      done("Tell the story", "2026-11-01T12:47:00Z"),
      done("Draw the ark", "2026-10-31T12:00:00Z", { completedByYou: true }),
      done("Learn the psalm", "2026-10-30T12:00:00Z", { completedByYou: true }),
      done("Visit a neighbour", "2026-10-29T12:00:00Z", { completedByYou: true }),
    ],
  },
} as const satisfies Record<string, { todo: ParentTask[]; done: ParentTask[] }>
