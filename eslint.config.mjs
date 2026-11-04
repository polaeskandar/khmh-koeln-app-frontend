import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import stylistic from "@stylistic/eslint-plugin"

const staticExport =
  "The app is a static export without a server at request time, see docs/architecture.md."

const restrictedImports = [
  { name: "next/headers", message: staticExport },
  { name: "next/cache", message: staticExport },
  { name: "server-only", message: staticExport },
  { name: "next/server", importNames: ["connection"], message: staticExport },
  { name: "next/link", message: "Use Link from @/i18n/navigation." },
  {
    name: "next/navigation",
    importNames: ["useRouter", "usePathname", "redirect"],
    message: "Use the locale-aware version from @/i18n/navigation.",
  },
]

const rawHtmlFiles = []

const toolDirective = /^\s*(eslint[- ]|@ts-expect-error|\/ <reference )/

const noComments = {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      comment:
        "No comments: names, types and small functions explain the code; what a reader still needs belongs in docs/ (AGENTS.md, Code style).",
    },
  },
  create: (context) => ({
    Program: () => {
      for (const comment of context.sourceCode.getAllComments()) {
        if (comment.type !== "Shebang" && !toolDirective.test(comment.value)) {
          context.report({ loc: comment.loc, messageId: "comment" })
        }
      }
    },
  }),
}

const blocks = ["if", "for", "while", "do", "switch", "try"]
const jumps = ["return", "throw", "break", "continue"]
const multiline = ["multiline-const", "multiline-let", "multiline-expression", "multiline-export"]

const codeStyle = {
  plugins: { "@stylistic": stylistic },
  rules: {
    curly: ["error", "all"],
    "no-else-return": ["error", { allowElseIf: false }],
    "@stylistic/padding-line-between-statements": [
      "error",
      { blankLine: "always", prev: "*", next: [...blocks, ...jumps, ...multiline] },
      { blankLine: "always", prev: [...blocks, ...multiline], next: "*" },
    ],
  },
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  codeStyle,
  {
    plugins: { local: { rules: { "no-comments": noComments } } },
    rules: { "local/no-comments": "error" },
  },
  {
    files: ["src/**", "test/**"],
    rules: {
      "no-restricted-imports": ["error", { paths: restrictedImports }],
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Call the API through api and dataOf() from @/lib/api/client." },
      ],
      "react/no-danger": "error",
    },
  },
  {
    files: ["src/app/page.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: restrictedImports.filter((path) => path.name !== "next/navigation") },
      ],
    },
  },
  { files: ["src/lib/api/**"], rules: { "no-restricted-globals": "off" } },
  ...(rawHtmlFiles.length > 0
    ? [{ files: rawHtmlFiles, rules: { "react/no-danger": "off" } }]
    : []),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "messages/*.d.json.ts",
    "src/lib/api/schema.d.ts",
    "android/**",
    "ios/**",
    "coverage/**",
  ]),
])

export default eslintConfig
