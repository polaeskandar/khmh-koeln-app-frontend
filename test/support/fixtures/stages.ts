import type { Stage } from "@/features/organization/stages/api"

export const SUNDAY_SCHOOL_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f10"
export const THIRD_CLASS_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f20"

export const thirdClass: Stage = {
  id: THIRD_CLASS_ID,
  name: "3rd Class",
  description: null,
  position: 2,
  archived: false,
  service: { id: SUNDAY_SCHOOL_ID, name: "Sunday School", tone: 1, archived: false },
  memberCount: 14,
  can: { manageStructure: true, manageMembers: true },
}
