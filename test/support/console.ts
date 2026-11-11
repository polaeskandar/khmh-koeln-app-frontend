import { format } from "node:util"
import { vi } from "vitest"

let logged: string[] = []

export function watchConsoleErrors() {
  logged = []

  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    logged.push(format(...args))
  })
}

export function checkConsoleErrors() {
  if (logged.length > 0) {
    throw new Error(`Unexpected console.error:\n\n${logged.join("\n\n")}`)
  }
}
