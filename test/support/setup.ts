import "@testing-library/jest-dom/vitest"

import { cleanup, configure } from "@testing-library/react"
import { afterAll, afterEach, beforeAll, vi } from "vitest"

import { server } from "@test/support/msw"
import { resetNavigation } from "@test/support/navigation"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...(await import("@test/support/navigation")).nextNavigationMock,
}))

configure({ asyncUtilTimeout: 3000 })

vi.stubGlobal(
  "matchMedia",
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
)

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

beforeAll(() => server.listen({ onUnhandledFrame: "error" }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetNavigation()
})

afterAll(() => server.close())
