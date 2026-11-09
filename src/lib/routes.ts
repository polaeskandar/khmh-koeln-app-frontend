import type { Uuid } from "@/lib/api/types/common"

function href(path: `/${string}`, query: Record<string, string | null | undefined> = {}) {
  const search = new URLSearchParams()

  for (const [name, value] of Object.entries(query)) {
    if (value) {
      search.set(name, value)
    }
  }

  const qs = search.toString()

  return qs ? `${path}?${qs}` : path
}

export const routes = {
  home: () => "/",
  services: () => "/services/",
  service: (id: Uuid) => href("/services/view/", { id }),
  serviceStages: (service: Uuid) => href("/services/stages/", { id: service }),
  stage: (id: Uuid) => href("/stages/view/", { id }),
  stageLessons: (stage: Uuid) => href("/stages/lessons/", { id: stage }),
  stageHomework: (stage: Uuid) => href("/stages/homework/", { id: stage }),
  stageAttendance: (stage: Uuid) => href("/stages/attendance/", { id: stage }),
  meetings: () => "/meetings/",
  schedules: () => "/meetings/schedules/",
  schedule: (id: Uuid) => href("/meetings/schedules/view/", { id }),
  session: (id: Uuid) => href("/meetings/sessions/view/", { id }),
  attendance: () => "/attendance/",
  takeAttendance: (session: Uuid) => href("/attendance/take/", { session }),
  attendanceSummary: (session: Uuid) => href("/attendance/summary/", { session }),
  members: () => "/members/",
  lesson: (id: Uuid) => href("/lessons/view/", { id }),
  newLesson: (stage: Uuid) => href("/lessons/new/", { stage }),
  editLesson: (id: Uuid) => href("/lessons/edit/", { id }),
  homework: (id: Uuid) => href("/homework/view/", { id }),
  newHomework: (stage: Uuid, lesson?: Uuid) => href("/homework/new/", { stage, lesson }),
  editHomework: (id: Uuid) => href("/homework/edit/", { id }),
  settings: () => "/settings/",
  newRole: () => "/settings/roles/new/",
  role: (id: Uuid) => href("/settings/roles/view/", { id }),
  dataRequests: () => "/settings/data-requests/",
  dataRequest: (id: Uuid) => href("/settings/data-requests/view/", { id }),
  account: () => "/account/",

  parentHome: () => "/parent/",
  parentChildren: () => "/parent/children/",
  parentHomework: (child?: Uuid) => href("/parent/homework/", { child }),
  parentHomeworkTask: (id: Uuid, child?: Uuid) => href("/parent/homework/view/", { id, child }),
  parentAccount: () => "/parent/account/",
  memberHome: () => "/member/",
  memberHomework: () => "/member/homework/",
  memberHomeworkTask: (id: Uuid) => href("/member/homework/view/", { id }),
  memberAccount: () => "/member/account/",

  signIn: (next?: string) => href("/sign-in/", { next }),
  signInPending: () => "/sign-in/pending/",
  signInUnconfirmed: () => "/sign-in/unconfirmed/",
  register: () => "/register/",
  registered: () => "/register/done/",
  forgotPassword: () => "/forgot-password/",
  setPassword: (token: string) => `/set-password/#token=${encodeURIComponent(token)}`,
  privacy: () => "/privacy/",
} as const
