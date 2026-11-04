import { readFile, writeFile } from "node:fs/promises"

import openapiTS, { astToString } from "openapi-typescript"
import { format, resolveConfig } from "prettier"

const SPEC = new URL("../openapi/openapi.json", import.meta.url)
const TYPES = new URL("../src/lib/api/schema.d.ts", import.meta.url)

const document = JSON.parse(await readFile(SPEC, "utf8"))

document.paths = Object.fromEntries(
  Object.entries(document.paths).map(([path, item]) => [path.replace(/^\/api(?=\/)/, ""), item])
)

const source = astToString(
  await openapiTS(document, { exportType: true, defaultNonNullable: false })
).replace(/\/\*\*[\s\S]*?\*\//g, "")

const options = await resolveConfig(TYPES.pathname)
await writeFile(TYPES, await format(source, { ...options, filepath: TYPES.pathname }))
