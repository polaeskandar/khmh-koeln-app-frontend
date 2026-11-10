import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import ts from "typescript"

const ROOT = fileURLToPath(new URL("..", import.meta.url))

export const DYNAMIC_KEYS = [
  "accountRequests.approve.ageCheck.*",
  "attendance.stage.cell.*",
  "attendance.stage.cellSr.*",
  "dashboard.greeting.*",
  "errors.recurrence.*",
  "history.*",
  "homework.completion.*",
  "homework.table.*",
  "homework.table.empty.*.text",
  "homework.table.empty.*.title",
  "lessons.list.*",
  "lessons.status.*",
  "parent.home.greeting.*",
  "permissions.actions.*",
  "permissions.resources.*.description",
  "permissions.resources.*.name",
  "privacy.channel.*",
  "privacy.kind.*",
  "roleEditor.*Hint",
  "services.table.tabs.*",
  "settings.roles.scope.*",
  "status.*",
]

function leafKeys(messages, prefix = "") {
  return Object.entries(messages).flatMap(([name, value]) =>
    typeof value === "string" ? [`${prefix}${name}`] : leafKeys(value, `${prefix}${name}.`)
  )
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true })

  return entries
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name) && entry.name !== "schema.d.ts")
    .map((entry) => join(entry.parentPath, entry.name))
}

function literalsOf(file, text) {
  const literals = new Set()
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, false)

  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      literals.add(node.text)
    }

    ts.forEachChild(node, visit)
  }

  visit(source)

  return literals
}

function patternOf(key) {
  const segment = key.replaceAll(".", "\\.").replaceAll("*", "[^.]*")

  return new RegExp(`^${segment}$`)
}

function usedIn(key, literals) {
  if (literals.has(key)) {
    return true
  }

  const segments = key.split(".")

  for (let split = 1; split < segments.length; split++) {
    const namespace = segments.slice(0, split).join(".")
    const rest = segments.slice(split).join(".")

    if (literals.has(namespace) && literals.has(rest)) {
      return true
    }
  }

  return false
}

export async function unusedMessageKeys(root = ROOT) {
  const messages = JSON.parse(await readFile(join(root, "messages/en.json"), "utf8"))
  const codes = JSON.parse(await readFile(join(root, "src/i18n/api-codes.json"), "utf8"))
  const dynamic = DYNAMIC_KEYS.map(patternOf)
  const problemKeys = new Set(Object.keys(codes).map((code) => `errors.${code}`))

  const files = await Promise.all(
    (await sourceFiles(join(root, "src"))).map(async (file) =>
      literalsOf(file, await readFile(file, "utf8"))
    )
  )

  return leafKeys(messages).filter(
    (key) =>
      !problemKeys.has(key) &&
      !dynamic.some((pattern) => pattern.test(key)) &&
      !files.some((literals) => usedIn(key, literals))
  )
}
