#!/usr/bin/env sh
set -eu

[ -f out/index.html ] || { echo "out/ is missing: run task build first." >&2; exit 1; }

if grep -rIlE "https?://localhost" out >/dev/null 2>&1; then
  echo "out/ points at a localhost URL; build with NEXT_PUBLIC_API_BASE_URL=/api." >&2
  grep -rIlE "https?://localhost" out >&2
  exit 1
fi

sha="${GITHUB_SHA:-$(git rev-parse HEAD)}"
printf '{"commit":"%s","builtAt":"%s"}\n' "$sha" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > out/version.json

archive="web-$sha.tar.gz"
tar -czf "$archive" -C out .
sha256sum "$archive" > "$archive.sha256" 2>/dev/null || shasum -a 256 "$archive" > "$archive.sha256"
echo "$archive"
