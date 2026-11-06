#!/usr/bin/env bash
set -euo pipefail

base="${1:?usage: $0 <base-url>}"
base="${base%/}"
failures=0

fail() {
  echo "FAIL $*" >&2
  failures=$((failures + 1))
}
pass() { echo "ok   $*"; }

fetch() {
  local tmp
  tmp="$(mktemp)"
  status="$(curl -s -o "$tmp" -D "$tmp.h" -w '%{http_code}' "${@:2}" "$base$1")"
  headers="$(tr -d '\r' < "$tmp.h" | tr '[:upper:]' '[:lower:]')"
  body="$(cat "$tmp")"
  rm -f "$tmp" "$tmp.h"
}

header() { printf '%s\n' "$headers" | sed -n "s/^$1: //p" | tail -n 1; }

expect_status() { [ "$status" = "$2" ] && pass "$1 → $2" || fail "$1 → $status, expected $2"; }
expect_header() {
  local value
  value="$(header "$2")"
  case "$value" in
    *"$3"*) pass "$1 $2: $3" ;;
    *) fail "$1 $2 is '$value', expected '$3'" ;;
  esac
}
expect_no_header_value() {
  local value
  value="$(header "$2")"
  case "$value" in
    *"$3"*) fail "$1 $2 is '$value', must not contain '$3'" ;;
    *) pass "$1 $2 is not $3" ;;
  esac
}

security_headers() {
  expect_header "$1" strict-transport-security "max-age="
  expect_header "$1" x-content-type-options "nosniff"
  expect_header "$1" referrer-policy "strict-origin-when-cross-origin"
  expect_header "$1" permissions-policy "camera=()"
  expect_header "$1" permissions-policy "microphone=()"
  expect_header "$1" permissions-policy "geolocation=()"
  expect_header "$1" permissions-policy "payment=()"
  expect_header "$1" x-frame-options "deny"
  expect_header "$1" x-robots-tag "noindex, nofollow"
  expect_header "$1" content-security-policy "default-src 'self'"
  expect_header "$1" content-security-policy "frame-ancestors 'none'"
  expect_header "$1" content-security-policy "object-src 'none'"
}

for path in / /en/ /de/ /ar/; do
  fetch "$path"
  expect_status "GET $path" 200
  expect_header "GET $path" content-type "text/html"
  expect_header "GET $path" cache-control "no-cache"
  security_headers "GET $path"
done

fetch /de
expect_status "GET /de" 301
expect_header "GET /de" location "/de/"

fetch /en/index.txt
expect_status "GET /en/index.txt" 200
expect_header "GET /en/index.txt" content-type "text/plain"
expect_header "GET /en/index.txt" cache-control "no-cache"
fetch /de/no-such-page/index.txt
expect_status "GET /de/no-such-page/index.txt" 404
expect_no_header_value "GET /de/no-such-page/index.txt" content-type "text/html"

fetch /no-such-page/
expect_status "GET /no-such-page/" 404
expect_header "GET /no-such-page/" content-type "text/html"
case "$body" in *'href="/en/"'*) pass "404 page links the languages" ;; *) fail "404 page is not 404.html" ;; esac

fetch /version.json
expect_status "GET /version.json" 200
expect_header "GET /version.json" content-type "application/json"
expect_header "GET /version.json" cache-control "no-cache"

fetch /robots.txt
expect_status "GET /robots.txt" 200
case "$body" in *"Disallow: /"*) pass "robots.txt disallows all" ;; *) fail "robots.txt doesn't disallow all" ;; esac

fetch /en/
asset="$(printf '%s' "$body" | grep -o '/_next/static/[^"]*\.js' | head -n 1)"
if [ -z "$asset" ]; then
  fail "no /_next/static/ script in /en/"
else
  fetch "$asset" -H "Accept-Encoding: gzip"
  expect_status "GET $asset" 200
  expect_header "GET $asset" cache-control "immutable"
  expect_header "GET $asset" content-encoding "gzip"
  security_headers "GET $asset"
fi

if [ "$failures" -gt 0 ]; then
  echo "$failures check(s) failed." >&2
  exit 1
fi
echo "All checks passed."
