import { screen } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { RecordPage } from "@/components/record-page"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))

const ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f10"

function Page() {
  return <RecordPage notFound={<p>Not found</p>}>{(id) => <p>Record {id}</p>}</RecordPage>
}

afterEach(() => vi.restoreAllMocks())

describe("RecordPage", () => {
  test.each(["?id=not-a-uuid", "", "?other=" + ID, `?id=${ID}x`])(
    "with %j shows the not-found fallback without calling the API",
    async (query) => {
      search.value = query
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      renderWithProviders(<Page />)
      expect(await screen.findByText("Not found")).toBeInTheDocument()
      expect(fetchSpy).not.toHaveBeenCalled()
    }
  )

  test("passes a valid id to the screen", async () => {
    search.value = `?id=${ID.toUpperCase()}`
    renderWithProviders(<Page />)
    expect(await screen.findByText(`Record ${ID}`)).toBeInTheDocument()
  })
})
