import { readdirSync } from "node:fs"
import { join } from "node:path"

const VENDORED = join("src", "components", "ui")

export function componentFiles(dir = "src", except: string[] = []): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      return path === VENDORED ? [] : componentFiles(path, except)
    }

    return entry.name.endsWith(".tsx") && !except.includes(path) ? [path] : []
  })
}
