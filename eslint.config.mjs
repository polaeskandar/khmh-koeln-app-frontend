import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const staticExport =
  "The app is a static export without a server at request time, see docs/architecture.md."

const restrictedImports = [
  { name: "next/headers", message: staticExport },
  { name: "next/cache", message: staticExport },
  { name: "server-only", message: staticExport },
  { name: "next/server", importNames: ["connection"], message: staticExport },
]

const rawHtmlFiles = []

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**"],
    rules: {
      "no-restricted-imports": ["error", { paths: restrictedImports }],
      "react/no-danger": "error",
    },
  },
  ...(rawHtmlFiles.length > 0
    ? [{ files: rawHtmlFiles, rules: { "react/no-danger": "off" } }]
    : []),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Native projects of the iOS and Android apps, including the web build Capacitor copies into them.
    "android/**",
    "ios/**",
    "coverage/**",
  ]),
])

export default eslintConfig
