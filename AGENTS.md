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

Blocks get braces and blank lines, as in the backend (its `docs/code-style.md`, 4a): every `if`, `for`, `while`,
`do`, `switch` and `try` has braces and a blank line before and after it; `return`, `throw`, `break` and
`continue` have a blank line before them; a statement that spans several lines has a blank line before and
after it; except where the statement opens or closes its block. No `else` after a `return`. ESLint enforces
this (`curly`, `no-else-return`, `@stylistic/padding-line-between-statements`), and `pnpm format` adds the
blank lines (`eslint --fix`, then Prettier).

A choice between more than two outcomes is a function with early returns, a `switch` or a lookup table, named
for what it decides, never a nested ternary. ESLint's `no-nested-ternary` rejects one in `src`, the vendored
`src/components/ui` aside.

## Feature docs

Every feature and the architecture is documented in `docs/features/`: one `<context>.md` per backend context,
`portals.md` and `architecture.md`, mirrored with the backend's `docs/features/`. A pull request updates the doc
of what it changes in the same PR: Features (the behaviour), Where (the code paths) and a History row (date ·
change · issue · PR), so each doc records what was done and where. A change without new behaviour (a refactor,
tests, tooling) adds only the History row; an architectural change updates `architecture.md`. Until a doc
exists, its issue (#294–#301) lists what it covers.

## Tests

Tests live in `test/`, mirroring `src/`: `test/lib/api/client.test.ts` tests `src/lib/api/client.ts`. A file
with several behaviours worth their own file adds one to the name (`stages-manager-page.reorder.test.tsx`).
Shared helpers (the setup file, MSW, render helpers, fixtures) live in `test/support/` and are imported as
`@test/support/…`; tests import the code under test as `@/…`. Checks over the whole code base (the catalogs, no
physical classes, no raw colours, no unused message key) live in `test/conventions/`.

## API

Call the API only through `api` and `dataOf()` from `@/lib/api/client`, the client generated from the backend's
OpenAPI document. `pnpm api:types` copies that document from the backend's dev server (`/api/openapi.json`) to
`openapi/openapi.json`, the contract snapshot, and generates `src/lib/api/schema.d.ts` from the copy. When a
backend change reaches the frontend, update both in the same PR; never edit either by hand, which
`pnpm api:types:check` rejects. Types of API data are `Schemas["…"]` from the same module; don't write them by hand.
A feature names them once, in its `api.ts`: one alias per schema, named after it without `Response` or `Request`
(`export type Service = Schemas["ServiceResponse"]`), keeping the suffix only where the bare name is taken
(`ServiceRequest`). Shared code writes `Schemas["…"]`.

## Names and structure

- **Screens and files.** A screen a route renders is `<Name>Page` in `<name>-page.tsx`, one per file
  (`ServiceDetailsPage` in `src/features/organization/services/service-details-page.tsx`). Every other file is
  named after what it holds; there are no `*-bits`, `*-parts` or `*-dialogs` files. ESLint caps a file in `src`
  at 400 lines and a `.tsx` function at 150: split by section before that.
- **Shared code** in `src/components`, `src/hooks`, `src/i18n` and `src/lib` never imports `src/features`
  (ESLint rejects it); it takes what a feature owns as props from its caller (`PortalAccountMenu`). What only
  one feature uses lives in that feature, not in `src/components`.
- **Components and hooks** are named function declarations, `export function ServiceDetailsPage()`, never arrow
  constants. A hook starts with `use`; one that two features need lives in `src/hooks/use-<name>.ts`
  (`src/hooks/use-today.ts`), not pasted into both.
- **API calls** are `<verb><Noun>Request` and queries `<noun>Query`, in the feature's `api.ts`
  (`addStageRequest` and `stageQuery` in `src/features/organization/stages/api.ts`). The lists of query keys a
  change invalidates are exported from an `api.ts` too (`ASSIGNMENT_QUERIES` in
  `src/features/organization/assignments/api.ts`); a component never retypes a key.
- **Changes** go through `useApiMutation` and start from what the person does, never from an effect. A refusal
  that means the screen is outdated refetches through `isStale` and `useRefetch` (`src/lib/api/refetch.ts`). A
  dialog with fields is a `FormDialog` in a `DialogMount`, rendered by the component that owns its change
  (`docs/ui-conventions.md`, Dialogs).
- **Callbacks.** A callback prop is `on<Event>` (`onOpenChange`, `onDone`). A local function is named for what it
  does (`submit`, `saveDraft`, `removeResource`), not for the event that calls it; there is no `handle<Event>`.
- **One term per thing**, taken from the vocabulary table of the backend's `docs/code-style.md` (section 7):
  service, stage, group, schedule, session, attendance, lesson, homework, person, guardian, account. A value
  keeps its name from the API to the screen; an id is `<thing>Id`, never the bare noun.
- **States, not flags.** A value with a fixed set of states is a union of literals
  (`useState<"edit" | "archive" | "restore" | "delete" | null>` in
  `src/features/organization/services/service-actions.tsx`). A component that creates or edits takes a
  discriminated union, not optional props that allow both at once. No positional booleans: `submitAnyway()`, not
  `submit(true)`.
- **Types** come from `react` by name: `import type { ReactNode } from "react"`
  (`src/components/page-states.tsx`), not `React.ReactNode`.
