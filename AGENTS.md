<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Code style

No comments. Names, types and small functions explain the code. What a reader still needs, such as a workaround
for a library bug or a constraint from outside the code, goes into `docs/`. ESLint's `local/no-comments` rejects
every comment in TypeScript and JavaScript except tool directives (`eslint-…`, `@ts-expect-error`,
`/// <reference …>`). CSS, YAML and shell files follow the same rule.
