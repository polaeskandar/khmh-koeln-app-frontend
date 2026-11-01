import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import Home from "@/app/page"

test("the home page names the app in its heading", () => {
  render(<Home />)
  expect(screen.getByRole("heading", { level: 1, name: "KHMK Köln" })).toBeInTheDocument()
})
