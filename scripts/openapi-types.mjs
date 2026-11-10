import openapiTS, { astToString } from "openapi-typescript"
import { format, resolveConfig } from "prettier"

const API_PREFIX = /^\/api(?=\/)/
const DOC_COMMENT = /\/\*\*[\s\S]*?\*\//g

async function formatted(source, filepath) {
  const options = await resolveConfig(filepath)

  return format(source, { ...options, filepath })
}

export function documentText(document, filepath) {
  return formatted(JSON.stringify(document, null, 2), filepath)
}

export async function typesFrom(document, filepath) {
  const paths = Object.fromEntries(
    Object.entries(document.paths).map(([path, item]) => [path.replace(API_PREFIX, ""), item])
  )

  const ast = await openapiTS(
    { ...document, paths },
    { exportType: true, defaultNonNullable: false }
  )

  return formatted(astToString(ast).replace(DOC_COMMENT, ""), filepath)
}
