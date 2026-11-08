import type { HomeworkFlags } from "@/features/learning/homework/api"

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
