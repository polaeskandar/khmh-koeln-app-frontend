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

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { local: { rules: { "no-comments": noComments } } },
    rules: { "local/no-comments": "error" },
  },
  {
    files: ["src/**", "test/**"],
    rules: {
      "no-restricted-imports": ["error", { paths: restrictedImports }],
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
  ...(rawHtmlFiles.length > 0
    ? [{ files: rawHtmlFiles, rules: { "react/no-danger": "off" } }]
    : []),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "android/**",
    "ios/**",
    "coverage/**",
  ]),
])

export default eslintConfig
