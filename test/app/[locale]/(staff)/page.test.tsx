import { render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"

import Home from "@/app/[locale]/(staff)/page"

vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }))

test("the home page names the app in its heading", async () => {
  render(
    await Home({ params: Promise.resolve({ locale: "en" }), searchParams: Promise.resolve({}) })
  )

  expect(screen.getByRole("heading", { level: 1, name: "KHMK Köln" })).toBeInTheDocument()
})
