import "@testing-library/jest-dom/vitest"

import { cleanup, configure } from "@testing-library/react"
import { afterAll, afterEach, beforeAll, vi } from "vitest"

import { server } from "@test/support/msw"

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

beforeAll(() => server.listen({ onUnhandledFrame: "error" }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => server.close())
