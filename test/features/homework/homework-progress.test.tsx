import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { apiUrl, problem } from "@test/support/api"
import { THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { homeworkFlags } from "@test/support/fixtures/homework"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { HomeworkProgress, ProgressRow } from "@/features/homework/api"
import { HomeworkProgressPage } from "@/features/homework/homework-progress"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

const HOMEWORK_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea001"

beforeEach(() => {
  search.value = `id=${HOMEWORK_ID}`
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => vi.restoreAllMocks())

let seq = 0

const parentAccount = (n: number) => ({
  id: `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea00${n}`,
  name: `Parent ${n}`,
})

const child = (
  firstName: string,
  lastName: string,
  extra: Partial<ProgressRow> = {}
): ProgressRow => ({
  person: {
    id: `0192f3a4-7b1c-7d2e-8f3a-${String(++seq).padStart(12, "0")}`,
    firstName,
    lastName,
    displayName: null,
  },
  inStage: true,
  done: false,
  completedAt: null,
  completedBy: null,
  completedAfterDueDate: false,
  parentAccounts: [parentAccount(1)],
  ownAccount: false,
  reportedBySelf: false,
  ...extra,
})

const mina = child("Mina", "Hanna", {
  done: true,
  completedAt: "2026-11-08T11:08:00Z",
  completedBy: { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb001", name: "Hoda Farag" },
  parentAccounts: [parentAccount(1), parentAccount(2)],
})

const rows = [
  child("Adel", "Aziz"),
  child("Ägid", "Aziz"),
  child("Bishoy", "Aziz"),
  mina,
  ...["Daniel", "Fady", "George", "Karim", "Marina", "Mark", "Paula"].map((n) => child(n, "Saad")),
  ...["Sara", "Shenouda", "Youssef"].map((n) => child(n, "Tadros", { parentAccounts: [] })),
]

rows[0]!.parentAccounts = []

const lesson = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e9002",
  title: "The Good Samaritan",
  teachingDate: "2026-11-01",
}

const progress = (extra: Partial<HomeworkProgress> = {}): HomeworkProgress => ({
  today: "2026-11-08",
  service: thirdClass.service,
  stage: { id: THIRD_CLASS_ID, name: "3rd Class", position: 2, archived: false },
  homework: {
    id: HOMEWORK_ID,
    title: "Learn the memory verse",
    status: "published",
    dueDate: "2026-11-08",
    publishedAt: "2026-11-01T12:00:00Z",
    lesson,
    counts: {
      assigned: 14,
      completed: 1,
      notCompleted: 13,
      completedAfterDueDate: 0,
      withoutParentAccount: 4,
      withoutAccount: 0,
      reportedTotal: 1,
    },
    can: homeworkFlags({
      edit: true,
      publish: false,
      unpublish: false,
      archive: false,
      restore: false,
      delete: false,
      viewProgress: true,
    }),
    instructions: "Say it once a day.\nAt bedtime is easiest.",
    resources: [
      { label: "The story as a video", url: "https://example.org/story" },
      { label: "Colouring page", url: null },
    ],
  },
  lesson,
  counts: {
    assigned: 14,
    completed: 1,
    notCompleted: 13,
    completedAfterDueDate: 0,
    withoutParentAccount: 4,
    withoutAccount: 0,
    reportedTotal: 1,
  },
  rows,
  ...extra,
})

function open(body: HomeworkProgress | (() => Response)) {
  server.use(
    http.get(apiUrl(`/homework/${HOMEWORK_ID}/progress`), () =>
      typeof body === "function" ? body() : HttpResponse.json(body)
    )
  )

  renderWithProviders(
    <SidebarProvider>
      <HomeworkProgressPage />
    </SidebarProvider>
  )
}

const tableRows = async () => (await screen.findByRole("table")).querySelectorAll("tbody tr")

const names = async () =>
  [...(await tableRows())].map((tr) => tr.querySelector("[dir=auto]")!.textContent)

test("shows the four figures and the tab counts", async () => {
  open(progress())
  const figures = (await screen.findByText("In 3rd Class")).closest("dl")!

  expect([...figures.querySelectorAll("dt + dd")].map((dd) => dd.textContent)).toEqual([
    "14",
    "1",
    "13",
    "4",
  ])

  expect(within(figures).getByText("Can’t report online")).toBeInTheDocument()

  for (const name of ["All (14)", "Reported done (1)", "Not yet (13)", "No account (4)"]) {
    expect(screen.getByRole("tab", { name })).toBeInTheDocument()
  }
})

test("a reported row says when and who, and how many parents", async () => {
  open(progress())
  await screen.findByRole("table")
  const row = screen.getByText("Mina Hanna").closest("tr")!
  expect(row).toHaveTextContent("Done")
  expect(row).toHaveTextContent("Today 12:08 · Hoda Farag")
  expect(row).toHaveTextContent("2 parents")
  expect(screen.getByText("Adel Aziz").closest("tr")).toHaveTextContent("Not yet")
  expect(screen.getByText("Adel Aziz").closest("tr")).toHaveTextContent("No account")
})

test("an erased reporter, a late report and a former child are worded gently", async () => {
  const late = child("Kirollos", "Iskander", {
    done: true,
    completedAt: "2026-11-09T17:20:00Z",
    completedBy: null,
    completedAfterDueDate: true,
    inStage: false,
  })

  open(progress({ rows: [...rows, late], today: "2026-11-10" }))
  await screen.findByRole("table")
  const row = screen.getByText("Kirollos Iskander").closest("tr")!
  expect(row).toHaveTextContent("Yesterday 18:20 · Former account · after the due date")
  expect(row).toHaveTextContent("No longer in 3rd Class; the report is kept")
  expect(screen.getByText("1 after the due date")).toBeInTheDocument()
})

test("searches names without accents and keeps the API order", async () => {
  open(progress())
  await screen.findByRole("table")
  const box = screen.getByRole("searchbox", { name: "Search names" })
  await userEvent.type(box, "mina")
  expect(await names()).toEqual(["Mina Hanna"])
  await userEvent.clear(box)
  await userEvent.type(box, "MÍNA")
  expect(await names()).toEqual(["Mina Hanna"])
  await userEvent.clear(box)
  await userEvent.type(box, "aziz")
  expect(await names()).toEqual(["Adel Aziz", "Ägid Aziz", "Bishoy Aziz"])
  await userEvent.click(screen.getByRole("tab", { name: "No account (4)" }))
  expect(await names()).toEqual(["Adel Aziz"])
  await userEvent.clear(box)
  await userEvent.type(box, "nobody")
  expect(screen.getByText("No one matches the search.")).toBeInTheDocument()
})

test("tabs filter by what was reported", async () => {
  open(progress())
  await screen.findByRole("table")
  await userEvent.click(screen.getByRole("tab", { name: "Reported done (1)" }))
  expect(await names()).toEqual(["Mina Hanna"])
  await userEvent.click(screen.getByRole("tab", { name: "Not yet (13)" }))
  expect((await names()).slice(0, 3)).toEqual(["Adel Aziz", "Ägid Aziz", "Bishoy Aziz"])
})

test("shows what parents read, the lesson and Edit", async () => {
  open(progress())

  const aside = within(
    (await screen.findByRole("heading", { name: "What parents and members read" })).closest(
      "aside"
    )!
  )

  expect(aside.getByText(/Say it once a day\./)).toHaveClass("whitespace-pre-line")

  expect(aside.getByRole("link", { name: "The story as a video" })).toHaveAttribute(
    "rel",
    "noreferrer"
  )

  expect(aside.getByText("Colouring page")).toBeInTheDocument()
  expect(aside.getByText(/of 14 reported done/)).toBeInTheDocument()

  expect(screen.getByRole("link", { name: "The Good Samaritan" })).toHaveAttribute(
    "href",
    `/lessons/view/?id=${lesson.id}`
  )

  expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
    "href",
    `/homework/edit/?id=${HOMEWORK_ID}`
  )

  expect(screen.getByRole("link", { name: "Homework" })).toHaveAttribute(
    "href",
    `/stages/homework/?id=${THIRD_CLASS_ID}`
  )
})

test("a draft shows its note instead of figures, and no Edit without the flag", async () => {
  const data = progress({ counts: null })

  data.homework = {
    ...data.homework,
    status: "draft",
    counts: null,
    can: homeworkFlags({
      edit: false,
      publish: false,
      unpublish: false,
      archive: false,
      restore: false,
      delete: false,
      viewProgress: true,
    }),
  }

  open(data)

  expect(
    await screen.findByText("This homework is a draft. Parents and members can’t see it yet.")
  ).toBeInTheDocument()

  expect(screen.queryByText("In 3rd Class")).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument()
})

test("a 403 says the progress can't be seen", async () => {
  open(() => problem(403, "forbidden"))
  expect(await screen.findByText("You can’t see this progress")).toBeInTheDocument()
})

test("names follow their own writing direction", async () => {
  open(progress())
  const cells = await tableRows()
  expect(cells[0]!.querySelector("[dir=auto]")).toHaveTextContent("Adel Aziz")
})
