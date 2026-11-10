# Frontend architecture

The frontend is one Next.js code base for three targets: the web app in the browser and the iOS and Android
apps, which wrap the same build in a native web view with Capacitor. The system as a whole (API, data model,
permissions) is described in the `backend` repository's `docs/`.

## Decisions

### A static export, bundled into the apps

`next.config.ts` sets `output: "export"`: `pnpm build` writes plain HTML, CSS and JavaScript to `out/`.
Capacitor copies these files into the iOS and Android projects, so the apps start from files on the device,
open without a connection and don't depend on a web server being reachable. This is the way Capacitor
supports; loading a hosted site with `server.url` is meant for live reload during development only. Browsers
get the same files from any static web server. Hosting them is set up outside this repository: the host
serves each page as a directory (`/de/` is `de/index.html`), answers unknown paths with `404.html` and status
404 rather than falling back to `index.html`, and sets the caching and security headers that the hosting
hand-off issue ([#285](https://github.com/polaeskandar/khmh-koeln-app-frontend/issues/285)) specifies.

What this rules out, because no Next.js server runs in production:

- Server actions, `cookies()`, `headers()`, route handlers that read the request, rewrites, redirects and
  the proxy (middleware).
- Request-time rendering and Cache Components. Next.js stops the build with "PPR cannot be enabled in export
  mode" when `cacheComponents` is on, so it is off. The UI prototype runs on a Next.js server and renders
  every page per request, because its account and language come from cookies; the product can't.
- Dynamic routes without `generateStaticParams`. Pages for one record (a session, a lesson) read their id
  from the query string instead, e.g. `/meetings/sessions/view/?id=…`; see [routes.md](routes.md).
- The default image optimizer (`images.unoptimized` is set).

Server components still run, at build time, for anything static. Everything that depends on the signed-in
person is fetched in client components from the Symfony API.

### Navigation inside the apps

Capacitor answers every path without a file extension with `index.html` (the single-page app convention),
on iOS and on Android. The apps therefore always start at `/`, and navigation must stay client-side:
`next/link` and `router.push`, never a full page load. Deep links (opening a session from a notification,
say) will arrive through Capacitor's App plugin (`appUrlOpen`) and be handed to the router; the plugin is
added with that ticket.

### Talking to the API

The contract is the backend's `docs/api.md`. The web app is served from the same origin as the API:
`https://app.khmk-koeln.com` serves the static files at `/` and the API at `/api` (D2), so the browser makes
no cross-origin calls and needs no CORS. `NEXT_PUBLIC_API_BASE_URL` is `/api` in production builds (an
absolute URL only if the API ever has to move to its own origin) and `http://localhost:8000/api` in
development; `src/lib/env.ts` checks it, and a production build fails without it. `NEXT_PUBLIC_RESET_BY_EMAIL=true`
lets people request a password link by email on the forgot-password page once the API can send email in
production; off unless set, the page says to ask the church office.

- **Generated client.** The types come from the backend's OpenAPI document. `pnpm api:types` reads it from
  the backend's dev server (`http://localhost:8000/api/openapi.json`, served in dev only), writes it
  pretty-printed to `openapi/openapi.json` and turns that copy into `src/lib/api/schema.d.ts` with
  [openapi-typescript](https://openapi-ts.dev), dropping the `/api` prefix that `NEXT_PUBLIC_API_BASE_URL`
  already holds. Both files are committed, so CI and builds need no backend. Calls go through `api` from
  `src/lib/api/client.ts`, an [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) client, wrapped in
  `dataOf()`: `dataOf(api.GET("/stages/{id}", { params: { path: { id } }, signal }))`. Paths, parameters,
  bodies and the data are checked against the document; types of API data are `Schemas["…"]`, never written
  by hand.
- **The contract snapshot.** `openapi/openapi.json` is the backend's document as the frontend is built
  against it; it sits outside `src/`, so it is never bundled. The frontend PR that follows a backend change
  runs `pnpm api:types` against the backend with that change and commits the copy and the types together,
  so the review shows the API change next to the code that follows it. `pnpm api:types:check` (in
  `task check` and CI) generates the types from the copy again, without the network, and fails when they
  differ from `schema.d.ts`: a hand edit to either file, or a copy committed without its types, doesn't
  pass. The types describe only what the backend serves; a screen for an endpoint the backend doesn't have
  yet waits for that endpoint.
- **Cookie session (D1).** Signing in sets an HttpOnly session cookie. The client sends every call with
  `credentials: "include"` and `cache: "no-store"`; the app never sends an `Authorization` header, never sees
  a token and keeps nothing about the session in web storage. Writes always send a JSON body (`{}` when the
  operation has none), as the API requires. ESLint allows `fetch` only under `src/lib/api`.
- **Problems.** A failed call rejects with an `ApiError` (`src/lib/api/problem.ts`): the status, the
  problem's `code` and `params`, `fieldErrors` by dot path, `retryAfter` from `Retry-After`, and documented
  extension members such as `candidates`. A response that isn't a problem (a proxy's HTML page) has
  `code: null`; a request that never reached the API is status 0 with the code `network`. A 401
  `auth.unauthenticated` also notifies `onUnauthorized()` listeners, which end the session in the app.
- **TanStack Query** caches reads in memory only, for 30 seconds before refetching. Reads are retried at
  most twice, and only after status 0 or a 5xx; 4xx answers and mutations are never retried.
- **MSW** answers the API in tests (`test/support/msw.ts`, with `problem()` and `renderWithQuery()` in
  `test/support/api.tsx`); a request without a handler fails the test.
- **Tests** share one setup (`test/support/setup.ts`): both navigation modules are mocked once, queries retry
  without a delay, and a test fails on any `console.error`, so a React or Radix warning, or a request MSW
  doesn't answer, is fixed rather than silenced. A test that expects an error stubs `console.error` itself.
  React warns when a client render creates a `<script>`, and next-themes' `ThemeProvider` renders its
  pre-paint script, which only the static HTML runs; the tests that render the provider give it
  `scriptProps={{ type: "text/plain" }}`.
- **The apps** will use bearer tokens after the MVP (backend #83); the cookie session is for the browser.
  Inside the apps the origin is `capacitor://localhost` on iOS and `https://localhost` on Android, so the
  API will need them in its CORS allowlist then.

### Code layout

`src/features/` follows the backend's bounded contexts (the `backend` repository's `docs/architecture.md`, "Code
layout"), so the screens for an endpoint sit under the context of its controller. Each context has one folder
per resource:

| Context        | Folders                                      |
| -------------- | -------------------------------------------- |
| `identity`     | `auth`, `account`, `accounts`, `roles`       |
| `organization` | `services`, `stages`, `assignments`          |
| `people`       | `members`, `guardians`, `children`, `groups` |
| `meetings`     | `meetings`, `attendance`, `dashboard`        |
| `learning`     | `lessons`, `homework`                        |
| `privacy`      | `data-requests`, `notice`, `own-data`        |

A file sits in the context whose endpoints it calls, as in the backend's `Interface/Api/<Area>`: the parent and
member portals' homework is in `learning/homework`, a parent's children in `people/children`, a member's groups
in `people/groups` and their meetings in `meetings/meetings`. A screen that combines several contexts sits with
its main one (the Settings page in `identity/accounts`). `portals/parent` and `portals/member` hold only what
has no backend counterpart: each portal's shell, navigation, home and account page. Tests in `test/features/`
use the same folders.

Shared code in `src/components`, `src/hooks`, `src/i18n` and `src/lib` doesn't import from `src/features`: a
feature builds on it, never the other way round. ESLint warns about the imports that still cross (the staff shell,
the portal account menu and the language switch); the warning becomes an error once they have moved.

### Data access

- **One `api.ts` per feature** (`src/features/<context>/<resource>/api.ts`) holds its response types, query options and
  calls; screens never build URLs or call `apiRequest()` themselves.
- **Permissions** come from `GET /me` only: read models carry no permission flags (the backend's
  `docs/api.md`, "What the viewer may do"). Screens offer an action when `useCan()` from
  `src/features/identity/auth/session.tsx` grants it, together with the item's own state (archived, status) as
  `docs/api.md` describes for that action. A role holds church-wide or only in the account's assigned groups
  (the backend's "Assigned groups"): `can(action, resource)` asks whether it holds anywhere, and a screen about
  one service, stage, session, lesson, homework or person passes its group, `can(action, resource, group)` or
  `useCanIn(group)`, so a servant sees an action only where it holds. `useCanAssign()` says who may assign
  accounts to groups, and `useUnassigned()` marks a servant without a group, whose dashboard and lists say to
  ask the church office.
- **Servants per group** on the member portal come from `GET /member/servants`: a servant's `groups` are the
  member's groups they serve, but `role` is `service_leader` when they lead any one of them. A group card calls
  a servant its service leader only where that is certain: all their groups are in the card's service, or they
  serve the service's own roster, which only a whole-service assignment covers.
- **Query keys** are `["<resource>", "list" | "detail", params]`, e.g. `["services", "list", {status: "all"}]`
  or `["sessions", "detail", id]`. A change invalidates by prefix (`["services"]`), so every list and detail
  of that resource refetches. Each resource's prefix is written once, in kebab-case, in
  `src/lib/api/query-keys.ts` (`SERVICES_KEY`); a feature's `api.ts` builds its query keys from it and exports
  the lists a change invalidates (`STAGE_QUERIES`, `MEMBERSHIP_QUERIES`). Components import those and never
  write a key themselves.
- **Changes** go through `useApiMutation(fn, {successMessage, invalidate, awaitRefetch, onSuccess, toastOnError})`
  (`src/lib/api/use-api-mutation.ts`). `execute()` resolves `{ok: true, data}` or `{ok: false, problem}`
  and never throws for an API problem, so a dialog stays open until it succeeds. Failures are never
  retried. With `awaitRefetch`, `pending` lasts until the invalidated queries have been fetched again, for
  a screen that shows the changed data next to the button (the person sheet), so it never offers an
  action on data it has just changed.
- **Problems in words:** `translateProblem()` shows `errors.<code>` with the problem's `params`, or the text
  for its status when the catalog has no such code; `fieldErrorsOf()` does the same per field. A 422 with
  field errors shows them on the fields, without a toast; a 401 `auth.unauthenticated` ends the session
  instead (#14); everything else is a toast (`docs/ui-conventions.md`, #13).
- **Codes:** `src/i18n/api-codes.json` lists every code of the backend's `docs/api.md` with its params, and
  `api-codes.test.ts` checks that en, de and ar have `errors.<code>` with exactly those ICU arguments. A PR
  that first consumes a new code adds it there with its three texts.
- **No persisted cache:** the query cache lives in memory and is cleared on sign-out; nothing about people
  is written to web storage.

### Capacitor 8

- App ID `de.khmkkoeln.app`, app name "KHMK Köln". Changing the ID later means editing `capacitor.config.ts`,
  the Xcode project and the Android Gradle files, so it stays fixed once the apps are in the stores.
- iOS 15+ with Swift Package Manager (Capacitor 8's default), Android 7.0+ (API 24), target API 36.
- `ios/` and `android/` are committed. Icons, splash screens, permissions, signing and store metadata live
  there. Plugins (camera, push notifications, …) are added per ticket with `pnpm add` and `pnpm cap sync`.
- Apple reviews whether an app does more than show a website (App Store guideline 4.2). A bundled app
  passes more easily than a wrapper of a hosted site; native touches such as push notifications help.
- `pnpm audit` reports a moderate advisory for `uuid` through `xcode`, a dependency of `@capacitor/cli`. It
  concerns `uuid` v3, v5 and v6 with a buffer argument; the CLI only calls `v4()`, and it runs on developer
  machines only, never in the apps.

### pnpm with a flat node_modules

The project uses pnpm 12, pinned in `package.json` (`packageManager` and `devEngines`). Its settings live in
`pnpm-workspace.yaml`:

- `nodeLinker: hoisted` gives an npm-style flat `node_modules`. Capacitor writes the location of its native
  packages into the committed native projects (`android/capacitor.settings.gradle`, and `Package.swift` once
  iOS plugins are added). With pnpm's default layout these paths point into
  `node_modules/.pnpm/<package>@<version>…`, change with every update and break when pnpm's global virtual
  store is used ([capacitor#8621](https://github.com/ionic-team/capacitor/issues/8621)). The flat layout keeps
  them at `node_modules/@capacitor/…`. The UI prototype, which has no native projects, keeps pnpm's default.
- pnpm runs no install scripts of dependencies unless they are allowed in `allowBuilds`. The only one so far,
  `unrs-resolver`, is declined: its script only checks for a native binding that pnpm installs anyway.

### Languages: English, German and Arabic

The UI is in English, German and Arabic; Arabic is read right to left. The texts live in
`messages/{en,de,ar}.json`, copied once from the UI prototype without its prototype-only texts; feature PRs
only add keys. `test/i18n/messages.test.ts` keeps the three catalogs in step (same keys, same ICU arguments,
no empty texts), `pnpm messages:unused` lists the keys no code reads (a key read through a template literal,
``t(`status.${status}`)``, matches a pattern in `DYNAMIC_KEYS` of `scripts/message-usage.mjs`), and every
`t()` call is type-checked against `messages/en.json` through the declaration next-intl generates
(`messages/en.d.json.ts`, git-ignored).

**Two layouts.** `app/layout.tsx` is the only root layout: it renders `<html>` and `<body>` for every page,
including the language-free ones (`/` and `out/404.html`). `app/[locale]/layout.tsx` prerenders each page
under it once per language (`generateStaticParams` with `en`, `de`, `ar`, and `dynamicParams = false`), calls
`setRequestLocale` and wraps the page in `NextIntlClientProvider`. `src/i18n/request.ts` takes the language
from that segment only, never from cookies or headers, and sets the time zone to Europe/Berlin.

**Adding a page:** create `app/[locale]/<path>/page.tsx`; read `locale` from `params`, call
`setRequestLocale(locale)` before any next-intl call, and translate metadata with
`getTranslations({ locale, namespace })`. Link with `Link`, `useRouter`, `usePathname` and `redirect` from
`@/i18n/navigation`, which keep the language in the path; ESLint rejects `next/link` and those functions
from `next/navigation`. Paths end in a slash (`trailingSlash`), so every page is a directory with an
`index.html`.

The decisions behind this:

- **next-intl with the language in the path** (`/en/…`, `/de/…`, `/ar/…`), each page built three times with
  `generateStaticParams`. A static export can't choose a language per request, and rendering one language at
  build time and switching in the browser would flash and break hydration. The path gives every page the
  right `<html lang dir>` from the first byte. (The prototype keeps the language in a cookie instead,
  because it has a server.)
- **Choosing the language:** `/` (where the apps always start) sends people to their language: the one they
  chose (Capacitor Preferences in the apps, `localStorage` on the web), else the device's, else English.
  Choosing a language also saves it on the account through the API, so it follows the person to other
  devices and emails use it.
- **Texts come from the frontend.** The API sends codes and parameters for errors and data for everything
  else (see the backend's API style); the apps put the words together.
- **Dates and numbers** are formatted from small per-language tables, not `Intl.DateTimeFormat`: the iOS
  web view, Android's Chromium and Node ship different ICU data and would print the same date differently.
  The prototype's `src/lib/format.ts` does this, including the Coptic date and schedule patterns ("Every
  other Sunday", „Jeden zweiten Sonntag“, «الأحد كل أسبوعين»). Arabic uses Western digits, as times and
  room numbers around them do.
- **Right to left:** `dir="rtl"` on `<html>` and Radix's direction provider; logical Tailwind classes only
  (`ms-`, `pe-`, `start-`, `text-end`); the preset's RTL support is on. Icons that point along the reading
  direction (arrows, chevrons) are mirrored by one CSS rule; props that only take physical sides (a sheet's
  `side`) follow the direction. Text people typed (a lesson title, a cancel reason, a note) gets
  `dir="auto"` on its own block or list, `<bdi>` in a heading, or is isolated inside sentences, so a
  question mark at its end stays at its end.
- **Arabic letters** come from Vazirmatn, an open, modern Arabic sans that reads well at the app's small
  sizes and sits well next to Oxanium. It goes after Oxanium and Geist in the font stack: the Latin fonts
  have no Arabic letters, so the browser takes those from Vazirmatn letter by letter, while Latin text and
  the Western digits keep the preset's fonts. Only its Arabic subset is preloaded. Arabic text is set
  without the preset's letter spacing, which would pull the joined letters apart. Readex Pro was tried
  too: in Chrome's text fields (and so in the Android app) it draws the final ي without its dots, so
  «علي» reads «على».
- **Font stand-ins go after the Arabic font.** next/font gives Oxanium and Geist a stand-in made from the
  device's Arial (`'Oxanium', 'Oxanium Fallback'`) to keep the layout steady while the fonts load. On Macs
  and Windows, Arial has Arabic letters: in `Oxanium, Oxanium Fallback, Vazirmatn` the stand-in would draw
  every Arabic letter and Vazirmatn would never be used. `adjustFontFallback: false` doesn't remove the
  stand-ins. So the root layout builds both stacks with `fontStack` (`src/lib/font-stack.ts`), every
  font's own face before any stand-in, and sets them on `<html>`: `'Oxanium', 'Vazirmatn', 'Oxanium
Fallback', 'Vazirmatn Fallback', ui-sans-serif, system-ui, sans-serif`. Android and Linux have no Arial
  with Arabic letters, so the bug doesn't show there.
- German is formal ("Sie"). The prototype's catalogs follow a glossary of the church's terms (Dienst, Stufe,
  Diener/in, Termin; خدمة، مرحلة، خادم، اجتماع).

### Dark mode

Light, dark or like the device, chosen in the account menu. `next-themes` sets the `dark` class before the
first paint and keeps the choice in `localStorage`, which works in the static export and the apps. Colours
come only from the preset's tokens, which have dark values; the prototype adds dark values for its status
colours and avatar tints. The apps' status bar should follow the theme (Capacitor's Status Bar plugin), a
ticket of its own.

### Design system

shadcn/ui with the preset [`b3a10z1gt0`](https://ui.shadcn.com/create?preset=b3a10z1gt0): Sera style, stone
and emerald, Oxanium for text and Geist for headings, square corners. One deviation: icons are Lucide
instead of the preset's Phosphor, because the premium shadcnblocks import `lucide-react` directly. Fonts come
through `next/font`, which puts them into the build, so the apps don't load them from the internet.

### TypeScript 5.9

`create-next-app` installs TypeScript 5.9. TypeScript 7 is out, but typescript-eslint, which
`eslint-config-next` uses, supports versions below 6.1 only. Moving on is a ticket of its own.

## Open questions for tickets

- How the apps keep a session after the MVP: bearer tokens in secure storage (backend #83).
- Who owns the Apple Developer and Google Play accounts, and how releases are signed and published.
