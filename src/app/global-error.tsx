"use client"

import "./globals.css"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-svh items-center justify-center p-6">
        <button
          type="button"
          onClick={() => reset()}
          className="border px-4 py-2 text-sm font-medium"
        >
          Try again · <span lang="de">Erneut versuchen</span> · <span lang="ar">حاول مرة أخرى</span>
        </button>
      </body>
    </html>
  )
}
