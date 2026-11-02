import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { SUNDAY_SCHOOL_ID, THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { HomeworkDetail, StageHomework } from "@/features/homework/api"
import { EditHomeworkPage, NewHomeworkPage } from "@/features/homework/homework-editor"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
  router.push.mockClear()
  router.replace.mockClear()
})

afterEach(() => vi.restoreAllMocks())

const HOMEWORK_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea001"
const stageRef = { id: THIRD_CLASS_ID, name: "3rd Class", position: 2, archived: false }

const zacchaeus = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e9001",
  title: "Zacchaeus",
  teachingDate: "2026-11-08",
}

const samaritan = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e9002",
  title: "The Good Samaritan",
  teachingDate: "2026-11-15",
}

const sheep = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e9003",
  title: "The Lost Sheep",
  teachingDate: "2026-11-29",
}

const list = (extra: Partial<StageHomework> = {}): StageHomework => ({
  today: "2026-11-10",
  stage: stageRef,
  tabs: { published: 0, draft: 0, archived: 0 },
  lessons: [sheep, samaritan, zacchaeus],
  defaultLessonId: samaritan.id,
  audienceSize: 14,
  can: { create: true },
  items: [],
  ...extra,
})

const detail = (extra: Partial<HomeworkDetail> = {}): HomeworkDetail => ({
  today: "2026-11-10",
  version: 1,
  id: HOMEWORK_ID,
  title: "Learn the memory verse",
  status: "published",
  dueDate: "2026-11-22",
  publishedAt: "2026-11-15T12:00:00Z",
  instructions: "Say it once a day.",
  resources: [{ label: "The story as a video", url: "https://example.org/story" }],
  minDueDate: "2026-11-14",
  lesson: { ...samaritan, passage: "Luke 10:25-37", memoryVerse: "Love your neighbour." },
  service: thirdClass.service,
  stage: stageRef,
  audienceSize: 14,
  counts: {
    assigned: 14,
    completed: 3,
    notCompleted: 11,
    completedAfterDueDate: 0,
    withoutParentAccount: 2,
    withoutAccount: 0,
    reportedTotal: 3,
  },
  can: {
    edit: true,
    publish: false,
    unpublish: false,
    archive: false,
    restore: false,
    delete: false,
    viewProgress: true,
  },
  ...extra,
})

function openNew(data: StageHomework, query = "", locale: Locale = "en") {
  search.value = `stage=${THIRD_CLASS_ID}${query}`
  const posted: { lesson: string; body: unknown }[] = []

  server.use(
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}`), () => HttpResponse.json(thirdClass)),
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}/homework`), () => HttpResponse.json(data)),
    http.post(apiUrl("/lessons/:lesson/homework"), async ({ params, request }) => {
      posted.push({ lesson: String(params.lesson), body: await request.json() })

      return HttpResponse.json({ id: HOMEWORK_ID, status: "draft" }, { status: 201 })
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <NewHomeworkPage />
    </SidebarProvider>,
    { locale }
  )

  return posted
}

function openEdit(data: HomeworkDetail) {
  search.value = `id=${HOMEWORK_ID}`
  const patched: unknown[] = []

  server.use(
    http.get(apiUrl(`/homework/${HOMEWORK_ID}`), () => HttpResponse.json(data)),
    http.patch(apiUrl(`/homework/${HOMEWORK_ID}`), async ({ request }) => {
      patched.push(await request.json())

      return HttpResponse.json({ id: HOMEWORK_ID, status: data.status })
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <EditHomeworkPage />
    </SidebarProvider>
  )

  return patched
}

const lessonSelect = () => screen.findByRole("combobox", { name: "Given with the lesson" })
const dueInput = () => screen.getByLabelText("Due date")

async function fill(title: string, instructions: string) {
  await userEvent.type(screen.getByRole("textbox", { name: "Title" }), title)
  await userEvent.type(screen.getByRole("textbox", { name: "What to do" }), instructions)
}

test("new homework preselects the default lesson and saves a draft a week after it", async () => {
  const posted = openNew(list())
  expect(await lessonSelect()).toHaveDisplayValue("Sun 15 Nov · The Good Samaritan")
  expect(dueInput()).toHaveValue("2026-11-22")
  expect(dueInput()).toHaveAttribute("min", "2026-11-15")

  expect(
    screen.getByText(/Once published, it is visible for 14 members of 3rd Class/)
  ).toBeVisible()

  await fill("Learn the verse", "Say it at bedtime.")
  await userEvent.click(screen.getByRole("button", { name: "Add resource" }))
  await userEvent.type(screen.getByRole("textbox", { name: "Resource 1" }), "The story as a video")

  await userEvent.type(
    screen.getByRole("textbox", { name: "Link for resource 1" }),
    "https://example.org/story"
  )

  await userEvent.click(screen.getByRole("button", { name: "Add resource" }))
  await userEvent.click(screen.getByRole("button", { name: "Save draft" }))
  await vi.waitFor(() => expect(posted).toHaveLength(1))

  expect(posted[0]).toEqual({
    lesson: samaritan.id,
    body: {
      title: "Learn the verse",
      instructions: "Say it at bedtime.",
      dueDate: "2026-11-22",
      resources: [{ label: "The story as a video", url: "https://example.org/story" }],
    },
  })

  await vi.waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "Saved as a draft. Parents and members can’t see it yet."
    )
  )

  expect(router.push).toHaveBeenCalledWith(`/stages/homework/?id=${THIRD_CLASS_ID}&status=draft`)
})

test("a cleared due date sends null", async () => {
  const posted = openNew(list())
  await lessonSelect()
  await fill("Pray together", "Once this week.")
  await userEvent.click(screen.getByRole("button", { name: "No due date" }))
  expect(dueInput()).toHaveValue("")
  await userEvent.click(screen.getByRole("button", { name: "Save draft" }))
  await vi.waitFor(() => expect(posted).toHaveLength(1))
  expect(posted[0]!.body).toMatchObject({ dueDate: null, resources: [] })
})

test("takes the lesson from the address and offers a week after it", async () => {
  openNew(list(), `&lesson=${sheep.id}`)
  expect(await lessonSelect()).toHaveDisplayValue("Sun 29 Nov · The Lost Sheep")
  await userEvent.click(screen.getByRole("button", { name: "No due date" }))

  await userEvent.click(
    screen.getByRole("button", { name: "One week after the lesson (Sun 6 Dec)" })
  )

  expect(dueInput()).toHaveValue("2026-12-06")
  expect(dueInput()).toHaveAttribute("min", "2026-11-29")
})

test("choosing another lesson moves the default due date with it", async () => {
  openNew(list())
  await userEvent.selectOptions(await lessonSelect(), sheep.id)
  expect(dueInput()).toHaveValue("2026-12-06")

  expect(
    screen.getByRole("button", { name: "One week after the lesson (Sun 6 Dec)" })
  ).toBeInTheDocument()
})

test("shows a 422 under each field, maps resources past blank rows, and focuses the first", async () => {
  openNew(list())

  server.use(
    http.post(apiUrl("/lessons/:lesson/homework"), () =>
      problem(422, "validation.failed", {
        fieldErrors: {
          title: { code: "homework.titleRequired", params: {} },
          dueDate: { code: "homework.dueBeforeLesson", params: {} },
          "resources.1.url": { code: "materials.url", params: {} },
        },
      })
    )
  )

  await lessonSelect()
  await userEvent.type(screen.getByRole("textbox", { name: "What to do" }), "Read it.")

  for (let i = 0; i < 3; i++) {
    await userEvent.click(screen.getByRole("button", { name: "Add resource" }))
  }

  await userEvent.type(screen.getByRole("textbox", { name: "Resource 1" }), "Video")

  await userEvent.type(
    screen.getByRole("textbox", { name: "Link for resource 1" }),
    "https://a.org"
  )

  await userEvent.type(screen.getByRole("textbox", { name: "Resource 3" }), "Song")
  await userEvent.type(screen.getByRole("textbox", { name: "Link for resource 3" }), "ftp://song")
  await userEvent.click(screen.getByRole("button", { name: "Save draft" }))
  const title = screen.getByRole("textbox", { name: "Title" })
  await vi.waitFor(() => expect(title).toHaveFocus())
  expect(title).toHaveAttribute("aria-invalid", "true")
  expect(screen.getByText("Enter a title, e.g. “Learn the memory verse”.")).toBeInTheDocument()
  expect(screen.getByText("The due date can’t be before the lesson.")).toBeInTheDocument()
  expect(dueInput()).toHaveAttribute("aria-invalid", "true")

  expect(screen.getByRole("textbox", { name: "Link for resource 3" })).toHaveAttribute(
    "aria-invalid",
    "true"
  )

  expect(screen.getByRole("textbox", { name: "Link for resource 1" })).not.toHaveAttribute(
    "aria-invalid"
  )

  expect(screen.getByText("Enter a web address starting with https://")).toBeInTheDocument()
  expect(toast.error).not.toHaveBeenCalled()
})

test("removing a resource keeps a 422 on the resource it belongs to", async () => {
  openNew(list())

  server.use(
    http.post(apiUrl("/lessons/:lesson/homework"), () =>
      problem(422, "validation.failed", {
        fieldErrors: { "resources.1.url": { code: "materials.url", params: {} } },
      })
    )
  )

  await lessonSelect()
  await userEvent.type(screen.getByRole("textbox", { name: "Title" }), "Read")

  for (let i = 0; i < 3; i++) {
    await userEvent.click(screen.getByRole("button", { name: "Add resource" }))
  }

  await userEvent.type(screen.getByRole("textbox", { name: "Resource 1" }), "Video")
  await userEvent.type(screen.getByRole("textbox", { name: "Resource 2" }), "Song")
  await userEvent.type(screen.getByRole("textbox", { name: "Link for resource 2" }), "ftp://song")
  await userEvent.type(screen.getByRole("textbox", { name: "Resource 3" }), "Poster")
  await userEvent.click(screen.getByRole("button", { name: "Save draft" }))

  await vi.waitFor(() =>
    expect(screen.getByRole("textbox", { name: "Link for resource 2" })).toHaveAttribute(
      "aria-invalid",
      "true"
    )
  )

  await userEvent.click(screen.getByRole("button", { name: "Remove resource 1" }))

  expect(screen.getByRole("textbox", { name: "Link for resource 1" })).toHaveAttribute(
    "aria-invalid",
    "true"
  )

  expect(screen.getByRole("textbox", { name: "Link for resource 2" })).not.toHaveAttribute(
    "aria-invalid"
  )
})

test("a 409 on save is a toast", async () => {
  openNew(list())
  server.use(http.post(apiUrl("/lessons/:lesson/homework"), () => problem(409, "lessons.archived")))
  await lessonSelect()
  await fill("Learn the verse", "Say it.")
  await userEvent.click(screen.getByRole("button", { name: "Save draft" }))
  await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("This lesson is archived."))
  expect(router.push).not.toHaveBeenCalled()
})

test("someone who can't create homework sees no form", async () => {
  openNew(list({ can: { create: false } }))
  expect(await screen.findByText("You can’t assign homework here")).toBeInTheDocument()
  expect(screen.queryByRole("textbox", { name: "Title" })).not.toBeInTheDocument()
})

test("a stage without lessons asks for a lesson first", async () => {
  openNew(list({ lessons: [], defaultLessonId: null }))
  expect(await screen.findByText("Prepare a lesson first")).toBeInTheDocument()

  expect(screen.getByRole("link", { name: "New lesson" })).toHaveAttribute(
    "href",
    `/lessons/new/?stage=${THIRD_CLASS_ID}`
  )
})

test("editing published homework only saves changes, with minDueDate as min", async () => {
  const patched = openEdit(detail())
  const title = await screen.findByRole("textbox", { name: "Title" })
  expect(title).toHaveValue("Learn the memory verse")

  expect(screen.getByRole("link", { name: "Sun 15 Nov · The Good Samaritan" })).toHaveAttribute(
    "href",
    `/lessons/view/?id=${samaritan.id}`
  )

  expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  expect(dueInput()).toHaveAttribute("min", "2026-11-14")
  expect(screen.getByText(/the 3 completions already reported stay/)).toBeInTheDocument()
  const actions = within(screen.getByRole("group", { name: "Status" }))
  expect(actions.getAllByRole("button").map((b) => b.textContent)).toEqual(["Save changes"])

  expect(actions.getByRole("link", { name: "Cancel" })).toHaveAttribute(
    "href",
    `/homework/view/?id=${HOMEWORK_ID}`
  )

  await userEvent.clear(title)
  await userEvent.type(title, "Learn the verse by heart")
  await userEvent.click(actions.getByRole("button", { name: "Save changes" }))
  await vi.waitFor(() => expect(patched).toHaveLength(1))

  expect(patched[0]).toEqual({
    title: "Learn the verse by heart",
    instructions: "Say it once a day.",
    dueDate: "2026-11-22",
    resources: [{ label: "The story as a video", url: "https://example.org/story" }],
  })

  await vi.waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith("Saved. Parents and members see the new version.")
  )

  expect(router.push).toHaveBeenCalledWith(
    `/stages/homework/?id=${THIRD_CLASS_ID}&status=published`
  )
})

test("archived homework shows its notice instead of the form", async () => {
  openEdit(
    detail({
      status: "archived",
      can: {
        edit: false,
        publish: false,
        unpublish: false,
        archive: false,
        restore: false,
        delete: false,
        viewProgress: true,
      },
    })
  )

  expect(await screen.findByText("This homework is archived")).toBeInTheDocument()

  expect(screen.getByRole("link", { name: "Back to the homework" })).toHaveAttribute(
    "href",
    `/homework/view/?id=${HOMEWORK_ID}`
  )

  expect(screen.queryByRole("textbox", { name: "Title" })).not.toBeInTheDocument()
})

test("without edit rights there is no form", async () => {
  openEdit(
    detail({
      can: {
        edit: false,
        publish: false,
        unpublish: false,
        archive: false,
        restore: false,
        delete: false,
        viewProgress: false,
      },
    })
  )

  expect(await screen.findByText("You can’t change this homework")).toBeInTheDocument()
})

test("crumbs lead back to the stage's homework", async () => {
  openEdit(detail())
  const link = await screen.findByRole("link", { name: "Homework" })
  expect(link).toHaveAttribute("href", `/stages/homework/?id=${THIRD_CLASS_ID}`)

  expect(screen.getByRole("link", { name: "Sunday School" })).toHaveAttribute(
    "href",
    `/services/view/?id=${SUNDAY_SCHOOL_ID}`
  )
})

test("fields follow the writing direction in Arabic", async () => {
  openNew(list(), "", "ar")
  await screen.findAllByRole("combobox")

  for (const box of screen.getAllByRole("textbox")) {
    expect(box).toHaveAttribute("dir", "auto")
  }
})

test("Publish on new homework saves it, publishes it and opens the Published tab", async () => {
  const posted = openNew(list())
  const published: unknown[] = []

  server.use(
    http.post(apiUrl(`/homework/${HOMEWORK_ID}/publish`), async ({ request }) => {
      published.push(await request.json())

      return HttpResponse.json({
        id: HOMEWORK_ID,
        status: "published",
        publishedAt: "2026-11-10T12:00:00Z",
      })
    })
  )

  await lessonSelect()
  await fill("Learn the verse", "Say it at bedtime.")
  await userEvent.click(screen.getByRole("button", { name: "Publish" }))

  await vi.waitFor(() =>
    expect(router.push).toHaveBeenCalledWith(
      `/stages/homework/?id=${THIRD_CLASS_ID}&status=published`
    )
  )

  expect(posted).toHaveLength(1)
  expect(published).toEqual([{}])

  expect(toast.success).toHaveBeenCalledExactlyOnceWith(
    "Published. Parents and members of the class can see it now."
  )
})

test("a refused publish keeps the saved draft, and a retry creates no second task", async () => {
  const posted = openNew(list())
  const patched: unknown[] = []
  let publishes = 0

  server.use(
    http.post(apiUrl(`/homework/${HOMEWORK_ID}/publish`), () => {
      publishes++

      return problem(409, "homework.lessonArchived")
    }),
    http.patch(apiUrl(`/homework/${HOMEWORK_ID}`), async ({ request }) => {
      patched.push(await request.json())

      return HttpResponse.json({ id: HOMEWORK_ID, status: "draft" })
    })
  )

  await lessonSelect()
  await fill("Learn the verse", "Say it.")
  await userEvent.click(screen.getByRole("button", { name: "Publish" }))

  await vi.waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("The lesson is archived. Restore the lesson first.")
  )

  await vi.waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith(`/homework/edit/?id=${HOMEWORK_ID}`)
  )

  expect(router.push).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole("button", { name: "Publish" }))
  await vi.waitFor(() => expect(publishes).toBe(2))
  expect(posted).toHaveLength(1)
  expect(patched).toHaveLength(1)
})

test("a draft offers Publish only with can.publish", async () => {
  const draft = { status: "draft" as const, publishedAt: null, counts: null }

  openEdit(
    detail({
      ...draft,
      can: {
        edit: true,
        publish: true,
        unpublish: false,
        archive: false,
        restore: false,
        delete: false,
        viewProgress: true,
      },
    })
  )

  const status = within(await screen.findByRole("group", { name: "Status" }))
  expect(status.getAllByRole("button").map((b) => b.textContent)).toEqual(["Publish", "Save draft"])
})

test("a draft without can.publish only saves", async () => {
  const draft = { status: "draft" as const, publishedAt: null, counts: null }

  openEdit(
    detail({
      ...draft,
      can: {
        edit: true,
        publish: false,
        unpublish: false,
        archive: false,
        restore: false,
        delete: false,
        viewProgress: true,
      },
    })
  )

  const status = within(await screen.findByRole("group", { name: "Status" }))
  expect(status.getAllByRole("button").map((b) => b.textContent)).toEqual(["Save draft"])
})
