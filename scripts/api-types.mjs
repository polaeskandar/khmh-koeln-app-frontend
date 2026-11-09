import { readFile, writeFile } from "node:fs/promises"

import openapiTS, { astToString } from "openapi-typescript"
import { format, resolveConfig } from "prettier"

const SPEC = "http://localhost:8000/api/openapi.json"
const PENDING = new URL("../openapi/pending.json", import.meta.url)
const TYPES = new URL("../src/lib/api/schema.d.ts", import.meta.url)

async function fetchDocument() {
  const response = await fetch(SPEC).catch((error) => {
    throw new Error(`Can't reach ${SPEC}: start the backend's dev server first.`, { cause: error })
  })

  if (!response.ok) {
    throw new Error(`${SPEC} answered ${response.status}.`)
  }

  return response.json()
}

const document = await fetchDocument()
const pending = JSON.parse(await readFile(PENDING, "utf8"))

document.paths = { ...pending.paths, ...document.paths }
document.components.schemas = { ...pending.components.schemas, ...document.components.schemas }

document.paths = Object.fromEntries(
  Object.entries(document.paths).map(([path, item]) => [path.replace(/^\/api(?=\/)/, ""), item])
)

const source = astToString(
  await openapiTS(document, { exportType: true, defaultNonNullable: false })
).replace(/\/\*\*[\s\S]*?\*\//g, "")

const options = await resolveConfig(TYPES.pathname)
await writeFile(TYPES, await format(source, { ...options, filepath: TYPES.pathname }))
