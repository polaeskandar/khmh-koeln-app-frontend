import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { boardOf, detailOf, rosterPeople, thirdClassBoard } from "@test/support/fixtures/board"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { address, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { AttendanceSheet } from "@/features/meetings/attendance/api"
import { CorrectionDialog } from "@/features/meetings/attendance/correction-dialog"
import { TakeAttendancePage } from "@/features/meetings/attendance/take-attendance-page"

beforeEach(() => {
  vi.spyOn(toast, "error")
})

const rita = {
  id: "0192f3a4-7b1c-7d2e-8f40-000000000077",
  firstName: "Rita",
  lastName: "Henein",
  displayName: null,
}

const daniel = { id: "a1", name: "Daniel Mikhail" }
const mina = rosterPeople[4]

function boardWithRecent(): AttendanceSheet {
  const board = thirdClassBoard()
  const minaMark = { id: "m-mina", recordedAt: "2026-11-08T12:01:00+01:00" }

  return {
    ...board,
    roster: board.roster.map((row) =>
      row.person.id === mina.id ? { ...row, mark: minaMark } : row
    ),
    recentlyMarked: [
      {
        person: rita,
        mark: { id: "m-rita", recordedAt: "2026-11-08T12:08:00+01:00" },
      },
      {
        person: rosterPeople[0],
        mark: { id: "m-anna", recordedAt: "2026-11-08T12:06:00+01:00" },
      },
      { person: mina, mark: minaMark },
    ],
  }
}

function open(
  board: AttendanceSheet,
  handlers: Parameters<typeof server.use> = [],
  locale: Locale = "en"
) {
  address.set(`session=${board.session.id}`)
  let current = board
  const calls = { close: 0, get: 0, removed: [] as unknown[] }

  server.use(
    http.get(apiUrl(`/sessions/${board.session.id}`), () => HttpResponse.json(detailOf(board))),
    http.get(apiUrl(`/sessions/${board.session.id}/attendance`), () => {
      calls.get++

      return HttpResponse.json(boardOf(current))
    }),
    http.get(apiUrl(`/sessions/${board.session.id}/attendance/corrections`), () =>
      HttpResponse.json({ items: current.corrections })
    ),
    http.delete(
      apiUrl(`/sessions/${board.session.id}/attendance/:person`),
      async ({ request, params }) => {
        calls.removed.push(await request.json())
        const row = current.roster.find((r) => r.person.id === params.person)!

        current = {
          ...current,
          roster: current.roster.map((r) =>
            r.person.id === params.person ? { ...r, mark: null } : r
          ),
          corrections: [
            ...current.corrections,
            {
              id: "c-new",
              person: row.person,
              recorded: { at: row.mark!.recordedAt, by: daniel },
              removed: { at: "2026-11-08T12:20:00+01:00", by: daniel },
              reason: "Tapped the wrong name",
            },
          ],
        }

        return new HttpResponse(null, { status: 204 })
      }
    ),
    ...handlers
  )

  renderWithProviders(<TakeAttendancePage />, { locale, me: me.servant, sidebar: true })

  return calls
}

const closeOn = (board: AttendanceSheet, answer: () => Response) => {
  const calls = { close: 0 }

  return [
    calls,
    http.post(apiUrl(`/sessions/${board.session.id}/close`), () => {
      calls.close++

      return answer()
    }),
  ] as const
}

describe("closing", () => {
  test("the dialog lists the roster count, the visitor and the not-absent line", async () => {
    const board = thirdClassBoard()
    open(board)
    await userEvent.click(await screen.findByRole("button", { name: "Close attendance" }))
    const dialog = within(screen.getByRole("alertdialog"))
    expect(dialog.getByText("7 of 14 on the roster marked present")).toBeInTheDocument()
    expect(dialog.getByText("1 person present who is not on the roster")).toBeInTheDocument()

    expect(
      dialog.getByText(/7 people not marked present\. That is not the same as absent\./)
    ).toBeInTheDocument()
  })

  test("two people not on the roster read in the plural", async () => {
    const board = thirdClassBoard()
    const [theo] = board.notOnRoster
    const lea = { ...theo.person, id: "0192f3a4-7b1c-7d2e-8f40-000000000098", firstName: "Lea" }

    open({
      ...board,
      counts: { ...board.counts, present: 9, notOnRoster: 2 },
      notOnRoster: [theo, { ...theo, person: lea }],
    })

    await userEvent.click(await screen.findByRole("button", { name: "Close attendance" }))
    const dialog = within(screen.getByRole("alertdialog"))
    expect(dialog.getByText("2 people present who are not on the roster")).toBeInTheDocument()
  })

  test("one request per confirm, then the summary", async () => {
    const board = thirdClassBoard()

    const [calls, handler] = closeOn(board, () =>
      HttpResponse.json({ id: board.session.id, status: "completed" })
    )

    open(board, [handler])
    await userEvent.click(await screen.findByRole("button", { name: "Close attendance" }))

    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Close attendance" })
    )

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        `/attendance/summary/?session=${board.session.id}`
      )
    )

    expect(calls.close).toBe(1)
  })

  test("after a network failure a second confirm sends again; a 409 refetches", async () => {
    const board = thirdClassBoard()
    let answers = [() => HttpResponse.error(), () => problem(409, "meetings.onlyActiveCanClose")]
    const [calls, handler] = closeOn(board, () => answers.shift()!())
    const counts = open(board, [handler])
    await userEvent.click(await screen.findByRole("button", { name: "Close attendance" }))

    const confirm = () =>
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Close attendance" })

    await userEvent.click(confirm())
    await waitFor(() => expect(calls.close).toBe(1))
    await waitFor(() => expect(confirm()).toBeEnabled())
    await userEvent.click(confirm())
    await waitFor(() => expect(calls.close).toBe(2))
    await waitFor(() => expect(counts.get).toBeGreaterThan(1))
    expect(router.replace).not.toHaveBeenCalled()
    answers = []
  })
})

describe("recently marked and corrections", () => {
  test("Recently marked shows Rita first with her time", async () => {
    open(boardWithRecent())
    const recent = within(await screen.findByRole("region", { name: "Recently marked" }))
    const items = recent.getAllByRole("listitem")
    expect(items[0]).toHaveTextContent(/^Rita Henein12:08$/)
    expect(items[1]).toHaveTextContent(/^Anna Fanous12:06$/)
  })

  test("removing Mina Hanna · 12:01 sends the trimmed note and lists her under Corrections", async () => {
    const calls = open(boardWithRecent())

    await userEvent.click(
      await screen.findByRole("button", { name: "Correct a mistake with a note" })
    )

    const dialog = within(screen.getByRole("alertdialog"))

    await userEvent.selectOptions(
      dialog.getByRole("combobox", { name: "Person" }),
      "Mina Hanna · 12:01"
    )

    const note = dialog.getByRole("textbox")
    expect(note).toHaveAttribute("maxLength", "200")
    await userEvent.type(note, "  Tapped the wrong name  ")
    await userEvent.click(dialog.getByRole("button", { name: "Remove mark" }))
    await waitFor(() => expect(calls.removed).toEqual([{ reason: "Tapped the wrong name" }]))
    const corrections = within(await screen.findByRole("region", { name: "Corrections" }))

    expect(corrections.getByRole("listitem")).toHaveTextContent(
      /^Mina Hanna removed today at 12:20: .Tapped the wrong name.$/
    )
  })

  test("the newest mark is preselected", async () => {
    open(boardWithRecent())

    await userEvent.click(
      await screen.findByRole("button", { name: "Correct a mistake with a note" })
    )

    const select = within(screen.getByRole("alertdialog")).getByRole("combobox", { name: "Person" })

    expect((select as HTMLSelectElement).selectedOptions[0].textContent).toBe(
      "Theo Mansour · 12:30"
    )
  })

  test("a reopened correction dialog starts again from the newest mark, with an empty note", async () => {
    open(boardWithRecent())
    const opener = await screen.findByRole("button", { name: "Correct a mistake with a note" })
    await userEvent.click(opener)
    let dialog = within(screen.getByRole("alertdialog"))

    await userEvent.selectOptions(
      dialog.getByRole("combobox", { name: "Person" }),
      "Mina Hanna · 12:01"
    )

    await userEvent.type(dialog.getByRole("textbox"), "Wrong name")
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
    await userEvent.click(opener)
    dialog = within(screen.getByRole("alertdialog"))
    const select = dialog.getByRole("combobox", { name: "Person" }) as HTMLSelectElement
    expect(select.selectedOptions[0].textContent).toBe("Theo Mansour · 12:30")
    expect(dialog.getByRole("textbox")).toHaveValue("")
  })

  test("a newer mark arriving while the dialog is open keeps the chosen person", () => {
    const board = boardWithRecent()

    const dialog = (shown: AttendanceSheet) => (
      <CorrectionDialog sheet={shown} open onOpenChange={() => {}} />
    )

    const view = renderWithProviders(dialog(board))
    const select = () => screen.getByRole("combobox", { name: "Person" }) as HTMLSelectElement
    expect(select().selectedOptions[0].textContent).toBe("Theo Mansour · 12:30")
    const later = { id: "m-later", recordedAt: "2026-11-08T12:45:00+01:00" }

    view.rerender(
      dialog({
        ...board,
        roster: board.roster.map((row, i) => (i === 0 ? { ...row, mark: later } : row)),
      })
    )

    expect(select().selectedOptions[0].textContent).toBe("Theo Mansour · 12:30")
  })

  test("both dialogs open in Arabic", async () => {
    open(boardWithRecent(), [], "ar")
    await userEvent.click(await screen.findByRole("button", { name: "إغلاق الحضور" }))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
  })
})
