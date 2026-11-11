import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { expect, test } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import { apiUrl, problem } from "@test/support/api"
import {
  goodSamaritan,
  lessonDetail,
  lessonOptions,
  lessonStage,
  stageLessons,
} from "@test/support/fixtures/lessons"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { address, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { expectToast } from "@test/support/toasts"
import type { LessonDetail } from "@/features/learning/lessons/api"
import { EditLessonPage } from "@/features/learning/lessons/edit-lesson-page"

const versions: (string | null)[] = []

function render(page: React.ReactNode, write?: () => Response, account: Me = me.administrator) {
  const sent: Record<string, unknown>[] = []
  versions.length = 0

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(account)),
    http.get(apiUrl(`/stages/${lessonStage.id}/lessons`), () => HttpResponse.json(stageLessons())),
    http.get(apiUrl(`/stages/${lessonStage.id}/lesson-options`), () =>
      HttpResponse.json(lessonOptions())
    ),
    http.post(apiUrl(`/stages/${lessonStage.id}/lessons`), async ({ request }) => {
      sent.push((await request.json()) as Record<string, unknown>)

      return (
        write?.() ??
        HttpResponse.json({ id: goodSamaritan.id, status: "ready", version: 1 }, { status: 201 })
      )
    }),
    http.put(apiUrl(`/lessons/${goodSamaritan.id}`), async ({ request }) => {
      sent.push((await request.json()) as Record<string, unknown>)
      versions.push(new URL(request.url).searchParams.get("version"))

      return (
        write?.() ?? HttpResponse.json({ id: goodSamaritan.id, status: "completed", version: 2 })
      )
    })
  )

  renderWithProviders(<SessionProvider>{page}</SessionProvider>, { sidebar: true })

  return sent
}

const openEdit = (detail: LessonDetail, write?: () => Response, account?: Me) => {
  address.set(`id=${detail.lesson.id}`)
  server.use(http.get(apiUrl(`/lessons/${detail.lesson.id}`), () => HttpResponse.json(detail)))

  return render(<EditLessonPage />, write, account)
}

test("Enter in a ready lesson saves it and keeps it ready", async () => {
  const sent = openEdit(lessonDetail({ status: "ready" }))
  await userEvent.type(await screen.findByLabelText("Title"), "{Enter}")
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]).toMatchObject({ status: "ready" })
})

test.each([
  ["draft", ["Mark ready", "Save draft"]],
  ["ready", ["Save", "Save as draft"]],
  ["completed", ["Save changes"]],
] as const)("a %s lesson offers %s", async (status, buttons) => {
  openEdit(lessonDetail({ status }))
  await screen.findByLabelText("Title")

  for (const name of buttons) {
    expect(screen.getByRole("button", { name })).toBeInTheDocument()
  }

  expect(
    screen.queryAllByRole("button", {
      name: /^(Mark ready|Save draft|Save|Save as draft|Save changes)$/,
    })
  ).toHaveLength(buttons.length)
})

test("a completed lesson's Save changes puts the whole lesson without a status, at its version", async () => {
  const sent = openEdit(
    lessonDetail({
      status: "completed",
      version: 4,
      summary: "Who is my neighbour?",
      objectives: "Love the neighbour",
      materials: [{ label: "Map of Judea", url: "https://example.org/map" }],
      notes: "Mina needs help reading.",
    })
  )

  await userEvent.click(await screen.findByRole("button", { name: "Save changes" }))
  await waitFor(() => expect(sent).toHaveLength(1))

  expect(sent[0]).toEqual({
    details: {
      title: "The Good Samaritan",
      summary: "Who is my neighbour?",
      passage: "Luke 10:25–37",
      memoryVerse: null,
      collaboratorIds: [],
    },
    meeting: { date: "2026-11-15" },
    plan: {
      objectives: "Love the neighbour",
      teachingPoints: null,
      activities: null,
      notes: "Mina needs help reading.",
      materials: [{ label: "Map of Judea", url: "https://example.org/map" }],
    },
    responsibleId: goodSamaritan.responsible!.id,
  })

  expect(versions).toEqual(["4"])
})

test("an editor who can't read members sends no notes and sees no notes field", async () => {
  const noMembers = {
    ...me.servant,
    permissions: me.servant.permissions.filter((p) => p.resource !== "members"),
  }

  const sent = openEdit(lessonDetail(), undefined, noMembers)
  await userEvent.click(await screen.findByRole("button", { name: "Save draft" }))
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(screen.queryByLabelText(/Notes for the servants/)).toBeNull()
  expect(sent[0]!.plan).not.toHaveProperty("notes")
})

test("a 409 changedMeanwhile keeps the form", async () => {
  openEdit(lessonDetail(), () => problem(409, "lessons.changedMeanwhile"))
  await userEvent.click(await screen.findByRole("button", { name: "Save draft" }))
  await expectToast("Someone else changed this lesson in the meantime. Reload it and save again.")
  expect(router.push).not.toHaveBeenCalled()
  expect(screen.getByLabelText("Title")).toHaveValue("The Good Samaritan")
})

test("an archived lesson shows its notice instead of the form", async () => {
  openEdit(lessonDetail({ archivedAt: "2026-11-01T10:00:00+01:00" }))
  expect(await screen.findByText("This lesson is archived")).toBeInTheDocument()
  expect(screen.queryByLabelText("Title")).toBeNull()
})
