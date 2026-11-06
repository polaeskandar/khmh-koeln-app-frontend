import { render } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"

import Root from "@/app/page"

const replace = vi.hoisted(() => vi.fn())
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }))

afterEach(() => {
  replace.mockReset()
  localStorage.clear()
  window.history.replaceState(null, "", "/")
})

test("a deep path loaded in the apps opens its language's home, once", () => {
  window.history.replaceState(null, "", "/de/services/view/")
  render(<Root />)
  expect(replace).toHaveBeenCalledExactlyOnceWith("/de/")
})

test("/ opens the stored language", () => {
  localStorage.setItem("khmk.locale", "ar")
  render(<Root />)
  expect(replace).toHaveBeenCalledExactlyOnceWith("/ar/")
})

test("the splash has no text", () => {
  const { container } = render(<Root />)
  expect(container.textContent).toBe("")
})
