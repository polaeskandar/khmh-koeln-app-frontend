# KHMK Köln frontend

The KHMK Köln web app, also packaged as iOS and Android apps. Next.js 16 (App Router, TypeScript, Tailwind
CSS 4) with shadcn/ui and the preset [`b3a10z1gt0`](https://ui.shadcn.com/create?preset=b3a10z1gt0), exported
as static files, and Capacitor 8 for the apps. The project is initialized only; features are added through
tickets.

## Requirements

| Tool | Version | Needed for |
| --- | --- | --- |
| Node.js | 22 or newer | Everything |
| pnpm | 12, pinned in `package.json` | Everything. `brew install pnpm`; pnpm 11 switches to the pinned version by itself, pnpm 10 can't |
| Xcode | 26 or newer, with its command line tools | The iOS app (macOS only) |
| Android Studio | 2025.2.1 or newer; it brings its own JDK | The Android app |

## Commands

```bash
pnpm install
pnpm dev               # http://localhost:3000
pnpm lint
pnpm typecheck
pnpm build             # static export to out/
pnpm cap:sync          # build, then copy out/ and the plugins into ios/ and android/
pnpm cap:ios           # open the iOS project in Xcode
pnpm cap:android       # open the Android project in Android Studio
```

To see changes on a phone or simulator without rebuilding, keep `pnpm dev` running and start the app with
live reload: `pnpm cap run ios -l --host <your computer's IP> --port 3000` (or `android`).

## How the web app and the apps fit together

- `pnpm build` writes a static export to `out/`. Browsers get these files from any static web server, and
  the apps bundle the same files: `cap sync` copies them into `ios/` and `android/`. No Node.js server runs in
  production; data comes from the Symfony API in the `backend` repository.
- The apps are called "KHMK Köln" with the app ID `de.khmkkoeln.app` (`capacitor.config.ts` and the native
  projects). They need iOS 15 or Android 7.0 (API 24) or newer.
- `ios/` and `android/` are ordinary native projects and are committed. Icons, permissions, signing and
  store settings are edited there, in Xcode and Android Studio. iOS uses Swift Package Manager. Build output
  and the copied web files are git-ignored.

A static export changes how features are built. There are no server actions, `cookies()` or `headers()`,
no route handlers that read the request, no rewrites or redirects, and dynamic routes need
`generateStaticParams`. Inside the apps, every path without a file extension opens `index.html`, so
navigation has to stay client-side. See [docs/architecture.md](docs/architecture.md) for the details and
the reasons.

## Premium blocks and the API key

Premium shadcnblocks are added with the shadcn CLI, which needs `SHADCNBLOCKS_API_KEY`:

- Keep the key in `.env.local` (git-ignored; see `.env.example`). The CLI loads that file and sends the key as
  the header defined in `components.json`.
- Add a block with `pnpm shadcn add @shadcnblocks/<block-name>`, then review and adapt the generated code like
  any other code.
- Never commit the key, copy it into source code or configuration files, expose it through `NEXT_PUBLIC_*`
  variables, print it in logs, or show it in screenshots or documentation. The app itself never needs it.
- If the key was ever shared in plain text (in a chat, an email or a ticket), rotate it in the shadcnblocks
  account and update your `.env.local`.

## Related repositories

- `ui`: the clickable prototype (`ui-prototype`) and its screenshots (`ui-mockups`), the reference for screens
  and behaviour.
- `backend`: the Symfony API, with the architecture decisions and the data model in its `docs/`.
