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
get the same files from any static web server.

What this rules out, because no Next.js server runs in production:

- Server actions, `cookies()`, `headers()`, route handlers that read the request, rewrites, redirects and
  the proxy (middleware).
- Request-time rendering and Cache Components. Next.js stops the build with "PPR cannot be enabled in export
  mode" when `cacheComponents` is on, so it is off. The UI prototype runs on a Next.js server and renders
  every page per request, because its account and language come from cookies; the product can't.
- Dynamic routes without `generateStaticParams`. Pages for one record (a session, a lesson) read their id
  from the query string or from client state instead, e.g. `/sessions/view?id=…`.
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

The browser and the apps call the API cross-origin. Inside the apps the origin is `capacitor://localhost` on
iOS and `https://localhost` on Android (Capacitor's defaults). The API needs a CORS allowlist with these
origins and the web app's own, and a sign-in method that doesn't rely on third-party cookies: bearer tokens
work the same everywhere; session cookies would need Capacitor's native HTTP (`CapacitorHttp`, which replaces
`fetch` in the apps). The sign-in ticket decides; the backend's architecture notes have the same point.

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

The UI is in English, German and Arabic; Arabic is read right to left. The UI prototype has every text of
the MVP in all three (`ui-prototype/messages/{en,de,ar}.json`, with a test that keeps them in step) and is
the reference for wording and layout; its catalogs can be copied over feature by feature.

The plan for the product, to be settled in the first ticket that adds texts:

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
- **Arabic letters** come from Noto Kufi Arabic, a square Kufi face that suits Oxanium. It goes after
  Oxanium and Geist in the font stack: the Latin fonts have no Arabic letters, so the browser takes those
  from Noto Kufi letter by letter, while Latin text keeps the preset's fonts. Arabic text is set without
  the preset's letter spacing, which would pull the joined letters apart.
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

- Sign-in method (see above), and how the apps keep a session: secure storage for tokens.
- Who owns the Apple Developer and Google Play accounts, and how releases are signed and published.
- The first feature ticket with texts sets up next-intl as planned above (language paths, the redirect at
  `/`, saving the choice).
- Whether the web app is hosted next to the API (same domain, no CORS for the browser) or separately.
