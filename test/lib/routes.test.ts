import { describe, expect, test } from "vitest"

import { routes } from "@/lib/routes"

const ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f10"
const CHILD = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f30"

describe("routes", () => {
  test.each([
    [routes.home(), "/"],
    [routes.services(), "/services/"],
    [routes.service(ID), `/services/view/?id=${ID}`],
    [routes.serviceStages(ID), `/services/stages/?id=${ID}`],
    [routes.stage(ID), `/stages/view/?id=${ID}`],
    [routes.stageLessons(ID), `/stages/lessons/?id=${ID}`],
    [routes.stageHomework(ID), `/stages/homework/?id=${ID}`],
    [routes.meetings(), "/meetings/"],
    [routes.schedules(), "/meetings/schedules/"],
    [routes.schedule(ID), `/meetings/schedules/view/?id=${ID}`],
    [routes.session(ID), `/meetings/sessions/view/?id=${ID}`],
    [routes.attendance(), "/attendance/"],
    [routes.takeAttendance(ID), `/attendance/take/?session=${ID}`],
    [routes.attendanceSummary(ID), `/attendance/summary/?session=${ID}`],
    [routes.members(), "/members/"],
    [routes.lesson(ID), `/lessons/view/?id=${ID}`],
    [routes.newLesson(ID), `/lessons/new/?stage=${ID}`],
    [routes.editLesson(ID), `/lessons/edit/?id=${ID}`],
    [routes.homework(ID), `/homework/view/?id=${ID}`],
    [routes.newHomework(ID), `/homework/new/?stage=${ID}`],
    [routes.newHomework(ID, CHILD), `/homework/new/?stage=${ID}&lesson=${CHILD}`],
    [routes.editHomework(ID), `/homework/edit/?id=${ID}`],
    [routes.editHomework(ID, CHILD), `/homework/edit/?id=${ID}&lesson=${CHILD}`],
    [routes.settings(), "/settings/"],
    [routes.newRole(), "/settings/roles/new/"],
    [routes.role(ID), `/settings/roles/view/?id=${ID}`],
    [routes.dataRequests(), "/settings/data-requests/"],
    [routes.dataRequest(ID), `/settings/data-requests/view/?id=${ID}`],
    [routes.account(), "/account/"],
    [routes.parentHome(), "/parent/"],
    [routes.parentChildren(), "/parent/children/"],
    [routes.parentHomework(), "/parent/homework/"],
    [routes.parentHomework(CHILD), `/parent/homework/?child=${CHILD}`],
    [routes.parentHomeworkTask(ID, CHILD), `/parent/homework/view/?id=${ID}&child=${CHILD}`],
    [routes.parentAccount(), "/parent/account/"],
    [routes.signIn(), "/sign-in/"],
    [routes.signInPending(), "/sign-in/pending/"],
    [routes.register(), "/register/"],
    [routes.registered(), "/register/done/"],
    [routes.forgotPassword(), "/forgot-password/"],
    [routes.privacy(), "/privacy/"],
  ])("%s", (href, expected) => {
    expect(href).toBe(expected)
    expect(new URL(href, "https://app.example").pathname.endsWith("/")).toBe(true)
  })

  test("parameters are URL-encoded", () => {
    expect(routes.service("a b&c")).toBe("/services/view/?id=a+b%26c")

    expect(routes.signIn("/en/members/?q=Mina")).toBe(
      "/sign-in/?next=%2Fen%2Fmembers%2F%3Fq%3DMina"
    )

    expect(routes.setPassword("a/b+c")).toBe("/set-password/#token=a%2Fb%2Bc")
  })
})
