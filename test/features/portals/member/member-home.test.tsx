import { screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import {
  memberServants,
  minaGroups,
  nevineGroups,
  nevineHomework,
  nevineMeetings,
} from "@test/support/fixtures/member"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { MemberHome } from "@/features/portals/member/member-home"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

const member = (displayName: string): Me => ({
  ...me.noRoles,
  account: { ...me.noRoles.account, displayName },
  member: { personId: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ee001", groupCount: 2 },
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-08T11:08:00Z") })
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

type Data = {
  account?: Me
  groups?: typeof nevineGroups | (() => Response)
  meetings?: typeof nevineMeetings
  homework?: typeof nevineHomework
  locale?: Locale
}

function open({
  account = member("Nevine Boulos"),
  groups = nevineGroups,
  meetings = nevineMeetings,
  homework = nevineHomework,
  locale = "en",
}: Data = {}) {
  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(account)),
    http.get(apiUrl("/member/groups"), () =>
      typeof groups === "function"
        ? groups()
        : HttpResponse.json({ today: "2026-11-08", items: groups })
    ),
    http.get(apiUrl("/member/servants"), () => HttpResponse.json({ items: memberServants })),
    http.get(apiUrl("/member/meetings"), () =>
      HttpResponse.json({
        today: "2026-11-08",
        from: "2026-11-08",
        to: "2026-11-21",
        items: meetings,
      })
    ),
    http.get(apiUrl("/member/homework"), ({ request }) => {
      const state = new URL(request.url).searchParams.get("state") as "todo" | "done"

      return HttpResponse.json({ today: "2026-11-08", items: homework[state] })
    })
  )

  renderWithProviders(
    <SessionProvider>
      <MemberHome />
    </SessionProvider>,
    { locale }
  )
}

test("greets the member and shows what is to do", async () => {
  open()
  expect(await screen.findByRole("heading", { name: "Good afternoon, Nevine" })).toBeInTheDocument()
  const toDo = within(await screen.findByRole("region", { name: "To do" }))
  const task = toDo.getByRole("link", { name: /Write the first eight letters/ })
  expect(task).toHaveTextContent("Due tomorrow")

  expect(task).toHaveAttribute(
    "href",
    "/member/homework/view/?id=0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef601"
  )

  expect(await screen.findByRole("region", { name: "Done recently" })).toHaveTextContent(
    "Say the Easter greeting at home"
  )
})

test("lists the next meetings, six at most, canceled without a reason", async () => {
  open()

  const section = (await screen.findByRole("heading", { name: "Next meetings" })).closest(
    "section"
  )!

  const items = await within(section).findAllByRole("listitem")
  expect(items).toHaveLength(6)
  expect(items[0]).toHaveTextContent("Level 1 · Level 1 class")
  expect(items[0]).toHaveTextContent("Mon")
  expect(items[0]).toHaveTextContent("9")
  expect(items[1]).toHaveTextContent("Canceled")
  expect(items[1]).not.toHaveTextContent(/reason/i)
  expect(items[1]!.querySelector(".line-through")).toHaveTextContent("Bible Study · Bible Study")
})

test("lists the groups with schedules, servants and the last lesson", async () => {
  open()
  const cards = await screen.findAllByRole("article")
  expect(cards.map((c) => c.getAttribute("aria-label"))).toEqual(["Bible Study", "Level 1"])
  expect(cards[0]).toHaveTextContent("Every Friday · 19:30–21:00 · Hall")
  expect(await within(cards[0]!).findByText(/Irene Wahba/)).toBeInTheDocument()
  expect(cards[0]).toHaveTextContent("⁨Irene Wahba⁩ (Service leader), ⁨Youssef Nashed⁩")
  expect(cards[1]).toHaveTextContent("⁨Irene Wahba⁩ (Service leader), ⁨Youssef Nashed⁩")
  expect(cards[1]).toHaveTextContent("Last lesson: “⁨The first eight letters⁩”")
  expect(within(cards[1]!).getByText("Ⲭⲣⲓⲥⲧⲟⲥ ⲁϥⲧⲱⲛϥ")).toHaveAttribute("dir", "auto")
})

test("a member without homework has no To do section", async () => {
  open({ account: member("Mina Hanna"), groups: minaGroups, homework: { todo: [], done: [] } })
  const cards = await screen.findAllByRole("article")
  expect(cards.map((c) => c.getAttribute("aria-label"))).toEqual(["Advanced", "Youth Meeting"])
  expect(screen.queryByRole("region", { name: "To do" })).not.toBeInTheDocument()
  expect(screen.queryByRole("region", { name: "Done recently" })).not.toBeInTheDocument()
})

test("done homework that fails to load keeps To do and offers to try again", async () => {
  open()

  server.use(
    http.get(apiUrl("/member/homework"), ({ request }) =>
      new URL(request.url).searchParams.get("state") === "done"
        ? problem(403, "forbidden")
        : HttpResponse.json({ today: "2026-11-08", items: [] })
    )
  )

  expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  expect(await screen.findByText(/nothing to do/i)).toBeInTheDocument()
})

test("empty groups and meetings say so", async () => {
  open({ groups: [], meetings: [] })

  expect(
    await screen.findByText(
      "You aren’t in any group at the moment. Talk to the servants or the church office."
    )
  ).toBeInTheDocument()

  expect(await screen.findByText("No meetings in the next two weeks.")).toBeInTheDocument()
})

test("an account unlinked meanwhile reads not linked", async () => {
  open({ groups: () => problem(403, "forbidden") })
  expect(await screen.findByText("Your account isn’t linked yet")).toBeInTheDocument()
})

test("in Arabic servant names are joined with the Arabic comma", async () => {
  open({ locale: "ar" })
  const cards = await screen.findAllByRole("article")
  await within(cards[1]!).findByText(/Irene Wahba/)
  expect(cards[1]).toHaveTextContent("⁨Irene Wahba⁩ (أمين الخدمة)، ⁨Youssef Nashed⁩")
})
