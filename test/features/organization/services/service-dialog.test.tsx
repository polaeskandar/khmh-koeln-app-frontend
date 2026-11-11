import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, expect, test, vi } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { insightsOf, services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { Me } from "@/features/identity/auth/api"
import type { ServiceFields } from "@/features/organization/services/api"
import { ServicesOverviewPage } from "@/features/organization/services/services-overview-page"

beforeEach(() => {
  vi.spyOn(toast, "error")
  vi.spyOn(toast, "success")
})

const sundaySchool = services.items[0]

function open(viewer: Me = me.administrator, locale: Locale = "en") {
  const sent: { method: string; body: unknown }[] = []

  let createAnswer: () => Response | Promise<Response> = () =>
    HttpResponse.json(
      { ...sundaySchool, id: "0192f3a4-7b1c-7d2e-8f3a-00000000aaaa", name: "Choir" },
      { status: 201 }
    )

  server.use(
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.get(apiUrl("/services/insights"), () => HttpResponse.json(insightsOf(services.items))),
    http.post(apiUrl("/services"), async ({ request }) => {
      sent.push({ method: "POST", body: await request.json() })

      return createAnswer()
    }),
    http.put(apiUrl(`/services/${sundaySchool.id}`), async ({ request }) => {
      const body = (await request.json()) as ServiceFields
      sent.push({ method: "PUT", body })

      return HttpResponse.json({ ...sundaySchool, ...body })
    })
  )

  renderWithProviders(<ServicesOverviewPage />, { locale, me: viewer, sidebar: true })

  return {
    sent,
    answerCreate: (answer: () => Response | Promise<Response>) => (createAnswer = answer),
  }
}

const dialog = () => within(screen.getByRole("dialog"))

test("creating sends the typed values and opens the new service", async () => {
  const { sent } = open()
  await userEvent.click(await screen.findByRole("button", { name: "New service" }))
  expect(dialog().getByRole("heading", { name: "New service" })).toBeInTheDocument()
  expect(dialog().getByLabelText("Name")).toHaveFocus()
  await userEvent.type(dialog().getByLabelText("Name"), "Choir")
  await userEvent.type(dialog().getByLabelText("Description (optional)"), "Hymns on Saturdays")
  await userEvent.click(dialog().getByRole("button", { name: "Create service" }))

  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith(
      "/services/view/?id=0192f3a4-7b1c-7d2e-8f3a-00000000aaaa"
    )
  )

  expect(sent).toEqual([
    { method: "POST", body: { name: "Choir", description: "Hymns on Saturdays" } },
  ])

  expect(toast.success).toHaveBeenCalledWith("Created Choir.")
})

test("Escape doesn't close the dialog while it saves", async () => {
  const { answerCreate } = open()
  let answer: (response: Response) => void = () => {}
  answerCreate(() => new Promise<Response>((resolve) => (answer = resolve)))
  await userEvent.click(await screen.findByRole("button", { name: "New service" }))
  await userEvent.type(dialog().getByLabelText("Name"), "Choir")
  await userEvent.click(dialog().getByRole("button", { name: "Create service" }))

  await waitFor(() =>
    expect(dialog().getByRole("button", { name: /Create service/ })).toBeDisabled()
  )

  await userEvent.keyboard("{Escape}")
  expect(screen.getByRole("dialog")).toBeInTheDocument()
  answer(HttpResponse.json({ ...sundaySchool, name: "Choir" }, { status: 201 }))
  await waitFor(() => expect(router.push).toHaveBeenCalled())
})

test("name errors show under Name with the dialog open; 403 toasts", async () => {
  const { answerCreate } = open()
  await userEvent.click(await screen.findByRole("button", { name: "New service" }))
  await userEvent.type(dialog().getByLabelText("Name"), "Sunday School")

  answerCreate(() =>
    problem(422, "checkFields", {
      fieldErrors: { name: { code: "services.nameTaken", params: { name: "Sunday School" } } },
    })
  )

  await userEvent.click(dialog().getByRole("button", { name: "Create service" }))

  await waitFor(() =>
    expect(dialog().getByLabelText("Name")).toHaveAccessibleDescription(
      "A service called “Sunday School” already exists."
    )
  )

  answerCreate(() =>
    problem(422, "checkFields", {
      fieldErrors: { name: { code: "services.nameTakenArchived", params: { name: "Choir" } } },
    })
  )

  await userEvent.click(dialog().getByRole("button", { name: "Create service" }))

  await waitFor(() =>
    expect(dialog().getByLabelText("Name")).toHaveAccessibleDescription(/archived/i)
  )

  answerCreate(() => problem(403, "services.adminOnlyCreate"))
  await userEvent.click(dialog().getByRole("button", { name: "Create service" }))
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith("You can’t create services."))
})

test("edit pre-fills and sends the whole service; Cancel sends nothing", async () => {
  const { sent } = open()
  const rows = await screen.findAllByRole("button", { name: "Actions for Sunday School" })
  await userEvent.click(rows[0])
  await userEvent.click(screen.getByRole("menuitem", { name: "Edit name and description" }))
  expect(dialog().getByRole("heading", { name: "Edit Sunday School" })).toBeInTheDocument()
  expect(dialog().getByLabelText("Name")).toHaveValue("Sunday School")
  await userEvent.click(dialog().getByRole("button", { name: "Cancel" }))
  expect(sent).toEqual([])
  await userEvent.click(rows[0])
  await userEvent.click(screen.getByRole("menuitem", { name: "Edit name and description" }))
  await userEvent.clear(dialog().getByLabelText("Description (optional)"))
  await userEvent.type(dialog().getByLabelText("Description (optional)"), "For children")
  await userEvent.click(dialog().getByRole("button", { name: "Save changes" }))

  await waitFor(() =>
    expect(sent).toEqual([
      { method: "PUT", body: { name: "Sunday School", description: "For children" } },
    ])
  )

  expect(toast.success).toHaveBeenCalledWith("Saved.")
})

test("saving without a change sends nothing and closes", async () => {
  const { sent } = open()
  const rows = await screen.findAllByRole("button", { name: "Actions for Sunday School" })
  await userEvent.click(rows[0])
  await userEvent.click(screen.getByRole("menuitem", { name: "Edit name and description" }))
  await userEvent.click(dialog().getByRole("button", { name: "Save changes" }))
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  expect(sent).toEqual([])
})

test("a servant sees neither the button nor menus", async () => {
  open(me.servant)
  await screen.findAllByRole("link", { name: "Sunday School" })
  expect(screen.queryByRole("button", { name: "New service" })).toBeNull()
  expect(screen.queryByRole("button", { name: /^Actions for / })).toBeNull()
})

test("a leader edits every active service but creates none", async () => {
  open(me.leader)
  await screen.findAllByRole("link", { name: "Sunday School" })
  expect(screen.queryByRole("button", { name: "New service" })).toBeNull()

  const menus = new Set(
    screen
      .getAllByRole("button", { name: /^Actions for / })
      .map((b) => b.getAttribute("aria-label"))
  )

  expect(menus).toEqual(
    new Set(services.items.filter((s) => !s.archived).map((s) => `Actions for ${s.name}`))
  )

  await userEvent.click(screen.getAllByRole("button", { name: "Actions for Youth Meeting" })[0])

  expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
    "Edit name and description",
  ])
})

test("the dialog runs right to left in Arabic", async () => {
  open(me.administrator, "ar")
  await userEvent.click(await screen.findByRole("button", { name: "خدمة جديدة" }))
  expect(screen.getByRole("dialog")).toBeInTheDocument()
})
