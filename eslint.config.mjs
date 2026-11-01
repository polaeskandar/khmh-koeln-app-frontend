import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// The app is a static export: nothing runs on a server at request time (docs/architecture.md).
const staticExport =
  "The app is a static export without a server at request time, see docs/architecture.md.";

/** Imports that don't work in the static export. Later rules add their own paths to this list. */
const restrictedImports = [
  { name: "next/headers", message: staticExport },
  { name: "next/cache", message: staticExport },
  { name: "server-only", message: staticExport },
  { name: "next/server", importNames: ["connection"], message: staticExport },
];

/** The only files that may use dangerouslySetInnerHTML. */
const rawHtmlFiles = [];

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
  ...(rawHtmlFiles.length > 0 ? [{ files: rawHtmlFiles, rules: { "react/no-danger": "off" } }] : []),
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
]);

export default eslintConfig;
