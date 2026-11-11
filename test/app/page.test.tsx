import { render } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"

import { router } from "@test/support/navigation"
import Root from "@/app/page"

afterEach(() => {
  localStorage.clear()
  window.history.replaceState(null, "", "/")
})

test("a deep path loaded in the apps opens its language's home, once", () => {
  window.history.replaceState(null, "", "/de/services/view/")
  render(<Root />)
  expect(router.replace).toHaveBeenCalledExactlyOnceWith("/de/")
})

test("/ opens the stored language", () => {
  localStorage.setItem("khmk.locale", "ar")
  render(<Root />)
  expect(router.replace).toHaveBeenCalledExactlyOnceWith("/ar/")
})

test("the splash has no text", () => {
  const { container } = render(<Root />)
  expect(container.textContent).toBe("")
})
