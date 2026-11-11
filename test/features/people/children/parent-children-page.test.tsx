import { screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { mimi, MIMI_ID, mina, MINA_ID } from "@test/support/fixtures/parent"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { ChildSummary } from "@/features/people/children/api"
import { ParentChildrenPage } from "@/features/people/children/parent-children-page"

const mariam = { ...mimi, fullName: "Mariam Hanna", name: "Mariam" }

const minaHanna = { ...mina, fullName: "Mina Hanna", toDo: 1, done: 2 }

function serve(items: ChildSummary[]) {
  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(me.parent)),
    http.get(apiUrl("/parent/children"), () => HttpResponse.json({ today: "2026-11-08", items }))
  )
}

describe("My children", () => {
  function open(items: ChildSummary[], locale: Locale = "en") {
    serve(items)
    renderWithProviders(<ParentChildrenPage />, { locale })
  }

  test("without children it says none is linked", async () => {
    open([])
    expect(await screen.findByText("No child is linked to your account yet.")).toBeInTheDocument()
  })

  test("one child: class, service and counts, linking to the homework", async () => {
    open([minaHanna])
    const card = await screen.findByRole("link", { name: /Mina Hanna/ })
    expect(card).toHaveAttribute("href", `/parent/homework/?child=${MINA_ID}`)
    expect(card).toHaveTextContent("3rd Class · Sunday School")
    expect(card).toHaveTextContent("1 to do · 2 done")
  })

  test("two children, one without a class and nothing to do", async () => {
    open([{ ...mariam, stage: null, service: null, toDo: 0, done: 1 }, minaHanna])
    const cards = await screen.findAllByRole("link")
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveAttribute("href", `/parent/homework/?child=${MIMI_ID}`)
    expect(cards[0]).toHaveTextContent("Not in a class at the moment")
    expect(cards[0]).toHaveTextContent("Nothing to do · 1 done")
  })

  test("in German", async () => {
    open(
      [
        { ...minaHanna, toDo: 2 },
        { ...mariam, stage: null, toDo: 0 },
      ],
      "de"
    )

    const cards = await screen.findAllByRole("link")
    expect(cards[0]).toHaveTextContent("2 offen · 2 erledigt")
    expect(cards[1]).toHaveTextContent("Zurzeit in keiner Klasse")
    expect(cards[1]).toHaveTextContent("Nichts zu erledigen")
  })

  test("in Arabic", async () => {
    open([minaHanna], "ar")
    const card = await screen.findByRole("link", { name: /Mina Hanna/ })
    expect(card).toHaveTextContent(/المطلوب: .+ · المنجز: /)
  })
})
