import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { SUNDAY_SCHOOL_ID, THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { address, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { expectToast } from "@test/support/toasts"
import type { HomeworkDetail } from "@/features/learning/homework/api"
import { EditHomeworkPage } from "@/features/learning/homework/edit-homework-page"

const HOMEWORK_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea001"

const stageRef = { id: THIRD_CLASS_ID, name: "3rd Class", position: 2 }

const samaritan = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e9002",
  title: "The Good Samaritan",
  teachingDate: "2026-11-15",
  archived: false,
}

const servantWithoutUpdate: Me = {
  ...me.servant,
  permissions: me.servant.permissions.filter(
    (p) => !(p.resource === "homework" && p.action === "update")
  ),
}

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
  archived: false,
  audienceSize: 14,
  counts: {
    assigned: 14,
    completed: 3,
    notCompleted: 11,
    completedAfterDueDate: 0,
    withoutParentAccount: 2,
    withoutAccount: 2,
    reportedTotal: 3,
  },
  ...extra,
})

const versions: (string | null)[] = []

function openEdit(data: HomeworkDetail, account: Me = me.servant, query = "") {
  address.set(`id=${HOMEWORK_ID}${query}`)
  const put: unknown[] = []
  versions.length = 0

  server.use(
    http.get(apiUrl(`/homework/${HOMEWORK_ID}`), () => HttpResponse.json(data)),
    http.put(apiUrl(`/homework/${HOMEWORK_ID}`), async ({ request }) => {
      put.push(await request.json())
      versions.push(new URL(request.url).searchParams.get("version"))

      return HttpResponse.json({ id: HOMEWORK_ID, status: data.status, version: data.version + 1 })
    })
  )

  renderWithProviders(<EditHomeworkPage />, { me: account, sidebar: true })

  return put
}

const dueInput = () => screen.getByLabelText("Due date")

const statusPanel = async () => within(await screen.findByRole("group", { name: "Status" }))

test("editing published homework puts the whole task at its version, with minDueDate as min", async () => {
  const patched = openEdit(detail({ version: 3 }))
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

  expect(versions).toEqual(["3"])

  await expectToast("Saved. Parents and members see the new version.")

  expect(router.push).toHaveBeenCalledWith(
    `/stages/homework/?id=${THIRD_CLASS_ID}&status=published`
  )
})

test("archived homework shows its notice instead of the form", async () => {
  openEdit(detail({ status: "archived" }))
  expect(await screen.findByText("This homework is archived")).toBeInTheDocument()

  expect(screen.getByRole("link", { name: "Back to the homework" })).toHaveAttribute(
    "href",
    `/homework/view/?id=${HOMEWORK_ID}`
  )

  expect(screen.queryByRole("textbox", { name: "Title" })).not.toBeInTheDocument()
})

test("without homework: update there is no form", async () => {
  openEdit(detail(), servantWithoutUpdate)
  expect(await screen.findByText("You can’t change this homework")).toBeInTheDocument()
})

test("homework of an archived lesson can't be edited", async () => {
  openEdit(detail({ lesson: { ...samaritan, archived: true, passage: null, memoryVerse: null } }))
  expect(await screen.findByText("You can’t change this homework")).toBeInTheDocument()
})

test("homework in an archived stage can't be edited", async () => {
  openEdit(detail({ archived: true }))
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

test("a draft offers Publish", async () => {
  openEdit(detail({ status: "draft", publishedAt: null, counts: null }))
  const status = within(await screen.findByRole("group", { name: "Status" }))
  expect(status.getAllByRole("button").map((b) => b.textContent)).toEqual(["Publish", "Save draft"])
})

test("the edit page opened from a lesson returns there after saving and on Cancel", async () => {
  const put = openEdit(detail(), me.servant, `&lesson=${samaritan.id}`)
  const status = await statusPanel()

  expect(status.getByRole("link", { name: "Cancel" })).toHaveAttribute(
    "href",
    `/lessons/view/?id=${samaritan.id}`
  )

  await userEvent.click(status.getByRole("button", { name: "Save changes" }))
  await vi.waitFor(() => expect(put).toHaveLength(1))

  await vi.waitFor(() =>
    expect(router.push).toHaveBeenCalledWith(`/lessons/view/?id=${samaritan.id}`)
  )
})
