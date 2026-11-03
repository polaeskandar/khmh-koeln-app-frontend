import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { SessionProvider } from "@/features/auth/session"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import {
  goodSamaritan,
  lessonDetail,
  lessonOptions,
  lessonStage,
  stageLessons,
} from "@test/support/fixtures/lessons"
import { me } from "@test/support/fixtures/me"
import { THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { LessonDetail, LessonRow } from "@/features/lessons/api"
import { EditLessonPage, NewLessonPage } from "@/features/lessons/lesson-editor"
import { LessonPage } from "@/features/lessons/lesson-page"
import { StageLessonsPage } from "@/features/lessons/stage-lessons"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

const daniel = { id: me.administrator.account.id, name: "Daniel Michael" }
const christine = { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f03", name: "Christine Adel" }
const bishoy = { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f02", name: "Bishoy Tadros" }

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
})

afterEach(() => vi.restoreAllMocks())

function editor(page: React.ReactNode, servants = [daniel, christine], write?: () => Response) {
  const sent: Record<string, unknown>[] = []

  const save = async ({ request }: { request: Request }) => {
    sent.push((await request.json()) as Record<string, unknown>)

    return (
      write?.() ?? HttpResponse.json({ id: goodSamaritan.id, status: "ready" }, { status: 201 })
    )
  }

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(me.administrator)),
    http.get(apiUrl(`/stages/${lessonStage.id}/lessons`), () => HttpResponse.json(stageLessons())),
    http.get(apiUrl(`/stages/${lessonStage.id}/lesson-options`), () =>
      HttpResponse.json(lessonOptions({ servants }))
    ),
    http.post(apiUrl(`/stages/${lessonStage.id}/lessons`), save),
    http.patch(apiUrl(`/lessons/${goodSamaritan.id}`), save)
  )

  renderWithProviders(
    <SessionProvider>
      <SidebarProvider>{page}</SidebarProvider>
    </SessionProvider>
  )

  return sent
}

const openNew = (servants?: (typeof daniel)[], write?: () => Response) => {
  search.value = `stage=${lessonStage.id}`

  return editor(<NewLessonPage />, servants, write)
}

const openEdit = (detail: LessonDetail, servants?: (typeof daniel)[]) => {
  search.value = `id=${detail.lesson.id}`
  server.use(http.get(apiUrl(`/lessons/${detail.lesson.id}`), () => HttpResponse.json(detail)))

  return editor(<EditLessonPage />, servants)
}

const helping = () => screen.findByRole("group", { name: "Helping" })

test("checking Christine sends her as a helper", async () => {
  const sent = openNew()
  const group = within(await helping())
  expect(group.queryByRole("checkbox", { name: "Daniel Michael" })).not.toBeInTheDocument()
  await userEvent.type(screen.getByLabelText("Title"), "Zacchaeus")
  await userEvent.click(group.getByRole("checkbox", { name: "Christine Adel" }))
  await userEvent.click(screen.getByRole("button", { name: "Mark ready" }))
  await vi.waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]).toMatchObject({ responsibleId: daniel.id, collaboratorIds: [christine.id] })
})

test("making a helper responsible removes her from the helpers", async () => {
  const sent = openNew()
  await userEvent.click(within(await helping()).getByRole("checkbox", { name: "Christine Adel" }))
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Responsible" }), christine.id)

  expect(
    within(await helping()).queryByRole("checkbox", { name: "Christine Adel" })
  ).not.toBeInTheDocument()

  await userEvent.type(screen.getByLabelText("Title"), "Zacchaeus")
  await userEvent.click(screen.getByRole("button", { name: "Mark ready" }))
  await vi.waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]).toMatchObject({ responsibleId: christine.id, collaboratorIds: [] })
})

test("an unchanged edit keeps helpers out of the PATCH, and a saved helper stays checked", async () => {
  const sent = openEdit(
    lessonDetail({ status: "ready", responsible: daniel, collaborators: [christine] }),
    [daniel, bishoy]
  )

  const group = within(await helping())
  expect(group.getByRole("checkbox", { name: "Christine Adel" })).toBeChecked()
  expect(group.getByRole("checkbox", { name: "Bishoy Tadros" })).not.toBeChecked()
  await userEvent.click(screen.getByRole("button", { name: "Save" }))
  await vi.waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]).not.toHaveProperty("collaboratorIds")
})

test("a 422 on the helpers shows under the group", async () => {
  openNew(undefined, () =>
    problem(422, "validation.failed", {
      fieldErrors: { collaboratorIds: { code: "lessons.helpersInStage", params: {} } },
    })
  )

  await userEvent.click(within(await helping()).getByRole("checkbox", { name: "Christine Adel" }))
  await userEvent.type(screen.getByLabelText("Title"), "Zacchaeus")
  await userEvent.click(screen.getByRole("button", { name: "Mark ready" }))

  expect(
    await within(await helping()).findByText("Everyone helping must be allowed to change lessons.")
  ).toBeInTheDocument()
})

test("with one servant there is no Helping group", async () => {
  openNew([daniel])
  await screen.findByRole("combobox", { name: "Responsible" })
  expect(screen.queryByRole("group", { name: "Helping" })).not.toBeInTheDocument()
})

const row = (id: string, title: string, extra: Partial<LessonRow> = {}): LessonRow => ({
  id,
  title,
  passage: null,
  teachingDate: "2026-11-15",
  status: "ready",
  responsible: daniel,
  collaborators: [],
  meeting: { kind: "none", date: "2026-11-15" },
  homework: { total: 0, published: 0, drafts: 0 },
  ...extra,
})

function list(locale: Locale = "en") {
  search.value = `id=${THIRD_CLASS_ID}`

  server.use(
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}`), () => HttpResponse.json(thirdClass)),
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}/lessons`), () =>
      HttpResponse.json(
        stageLessons({
          tabs: { upcoming: 2, previous: 0, archived: 0 },
          servants: [daniel, christine],
          items: [
            row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e9101", "Zacchaeus", {
              collaborators: [christine, bishoy],
            }),
            row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e9102", "The Lost Coin"),
          ],
        })
      )
    )
  )

  renderWithProviders(
    <SidebarProvider>
      <StageLessonsPage />
    </SidebarProvider>,
    { locale }
  )
}

test("rows name the helpers, and the Servant filter matches them", async () => {
  list()
  const zacchaeus = (await screen.findByText("Zacchaeus")).closest("a")!
  expect(zacchaeus).toHaveTextContent("Daniel Michael with Christine Adel and Bishoy Tadros")
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Servant" }), "Christine Adel")
  expect(screen.getByText("Zacchaeus")).toBeInTheDocument()
  expect(screen.queryByText("The Lost Coin")).not.toBeInTheDocument()
})

test("in Arabic helper names use the Arabic list format", async () => {
  list("ar")
  const zacchaeus = (await screen.findByText("Zacchaeus")).closest("a")!

  expect(zacchaeus).toHaveTextContent(
    /Christine Adel و ?Bishoy Tadros|Christine Adel، Bishoy Tadros/
  )
})

test("the lesson page lists Christine as Helping", async () => {
  search.value = `id=${goodSamaritan.id}`

  server.use(
    http.get(apiUrl(`/lessons/${goodSamaritan.id}`), () =>
      HttpResponse.json(lessonDetail({ responsible: daniel, collaborators: [christine] }))
    )
  )

  renderWithProviders(
    <SidebarProvider>
      <LessonPage />
    </SidebarProvider>
  )

  const helper = (await screen.findByText("Christine Adel")).closest("li")!
  expect(helper).toHaveTextContent("Christine AdelHelping")
  expect(screen.getByText("Daniel Michael").closest("li")).toHaveTextContent("Responsible")
})
