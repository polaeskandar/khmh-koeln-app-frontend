import { render } from "@testing-library/react"
import { ThemeProvider } from "next-themes"
import { afterEach, expect, test } from "vitest"

import { ThemeColor } from "@/components/theme-color"

afterEach(() => {
  document.head.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove())
})

test("the browser chrome takes the chosen appearance, whatever the device prefers", () => {
  for (const media of ["(prefers-color-scheme: light)", "(prefers-color-scheme: dark)"]) {
    const meta = document.createElement("meta")
    meta.name = "theme-color"
    meta.media = media
    meta.content = "#ffffff"
    document.head.append(meta)
  }

  render(
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ThemeColor />
    </ThemeProvider>
  )

  expect(
    [...document.head.querySelectorAll('meta[name="theme-color"]')].map((meta) =>
      meta.getAttribute("content")
    )
  ).toEqual(["#0c0a09", "#0c0a09"])
})
