# Deployment

The web app is one static bundle per commit, served next to the API on one origin (D2):
`https://app.khmk-koeln.com` serves the bundle at `/` and proxies `/api/` to the API. No Node.js server runs
in production, and there is no web container image (D3): the proxy on the server serves the files. The
backend's `docs/operations.md` describes the server; this page is what any host or proxy must do with the
bundle.

## The bundle

Every push to `main` runs CI (`.github/workflows/ci.yml`), which builds the static export and uploads
`web-<sha>.tar.gz` and `web-<sha>.tar.gz.sha256` as the workflow artifact `web-<sha>`. The archive holds
`out/` with a `version.json`:

```json
{ "commit": "<sha>", "builtAt": "2026-11-08T11:08:00Z" }
```

`task package` builds the same bundle locally (`scripts/package.sh`). It refuses a build whose files point at
a `http://localhost` URL.

### Build inputs

Repository variables, read at build time and written into the bundle (`NEXT_PUBLIC_*` values are public):

| Variable                    | Value                  | Notes                                                                                                                                                                                   |
| --------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`  | `/api`                 | Required. An absolute URL without a trailing slash only under D2's fallback, an API on its own origin (`https://api.khmk-koeln.com/api`), which then needs that origin in `connect-src` |
| `NEXT_PUBLIC_IMPRESSUM_URL` | The church's Impressum | Linked from the pages before sign-in (#29)                                                                                                                                              |

## Serving rules

- **Pages are directories.** `/de/` serves `de/index.html`. A path to a directory without its slash
  redirects to it with 301 (`/de` → `/de/`), keeping the host.
- **Unknown paths are a real 404:** `404.html` with status 404. Never an SPA fallback to `index.html`: it
  would answer every typo with 200 and break the client router's payload requests.
- **RSC payloads:** `.txt` files are `text/plain`. A missing one is a 404 that isn't HTML.
- **Compression:** gzip (or brotli) for HTML, CSS, JavaScript, JSON, SVG and `.txt`.
- **HTTPS only:** HTTP redirects to HTTPS, at the proxy.
- **`/api/` is proxied** to the API on the same origin (D2), so the session cookie stays first-party.
- **Access logs carry no query strings, `Referer` or cookies (D6):** a search such as
  `/en/members/?q=Kirollos` names people. Log the path only. An error log must not quote the request line
  either.

## Caching

| Path                                          | `Cache-Control`                       |
| --------------------------------------------- | ------------------------------------- |
| `/_next/static/*` (content-hashed)            | `public, max-age=31536000, immutable` |
| HTML, `.txt`, `version.json`, everything else | `no-cache`                            |

A release adds the new files before it removes the old chunks, so a page loaded just before the release can
still fetch the chunks it names.

## Headers

On every response of the bundle:

| Header                      | Value                                                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains`                                                                                                                                                                                     |
| `X-Content-Type-Options`    | `nosniff`                                                                                                                                                                                                                 |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                                                                                                                                                                         |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), payment=()`                                                                                                                                                                    |
| `X-Frame-Options`           | `DENY`                                                                                                                                                                                                                    |
| `X-Robots-Tag`              | `noindex, nofollow`                                                                                                                                                                                                       |
| `Content-Security-Policy`   | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |

`'unsafe-inline'` covers Next.js's inline bootstrap scripts and the language pre-paint script; a strict,
hash-based policy is #31. `robots.txt` disallows everything.

## Reference configuration and check

- `deploy/nginx.conf` with `deploy/security-headers.conf` implements every rule above. The production proxy
  (FrankenPHP/Caddy, backend #44) reproduces them.
- `scripts/check-static-hosting.sh <base-url>` checks a running host: statuses, the redirect, content types,
  caching and the headers.

To try it locally with Docker:

```bash
task package
mkdir -p /tmp/khmk-web && tar -xzf web-*.tar.gz -C /tmp/khmk-web
docker run --rm -d --name khmk-web -p 8080:8080 --add-host=api:127.0.0.1 \
  -v /tmp/khmk-web:/usr/share/nginx/html:ro \
  -v "$PWD/deploy/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$PWD/deploy/security-headers.conf:/etc/nginx/khmk/security-headers.conf:ro" \
  nginx:stable
scripts/check-static-hosting.sh http://localhost:8080
```
