import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { documentText, typesFrom } from "./openapi-types.mjs"

const SPEC = "http://localhost:8000/api/openapi.json"
const COPY = fileURLToPath(new URL("../openapi/openapi.json", import.meta.url))
const TYPES = fileURLToPath(new URL("../src/lib/api/schema.d.ts", import.meta.url))

async function fetchDocument() {
  const response = await fetch(SPEC).catch((error) => {
    throw new Error(`Can't reach ${SPEC}: start the backend's dev server first.`, { cause: error })
  })

  if (!response.ok) {
    throw new Error(`${SPEC} answered ${response.status}.`)
  }

  return response.json()
}

async function typesFromCopy() {
  return typesFrom(JSON.parse(await readFile(COPY, "utf8")), TYPES)
}

async function update() {
  await writeFile(COPY, await documentText(await fetchDocument(), COPY))
  await writeFile(TYPES, await typesFromCopy())
}

async function check() {
  const types = await typesFromCopy()

  if (types === (await readFile(TYPES, "utf8"))) {
    return
  }

  const generated = join(await mkdtemp(join(tmpdir(), "api-types-")), "schema.d.ts")
  await writeFile(generated, types)

  console.error(
    `src/lib/api/schema.d.ts doesn't match openapi/openapi.json; the types generated from the copy are in ${generated}. Run pnpm api:types with the backend's dev server running.`
  )

  process.exitCode = 1
}

await (process.argv.includes("--check") ? check() : update())
