import type { Metadata, Viewport } from "next"
import { Geist, Oxanium, Vazirmatn } from "next/font/google"

import { QueryProvider } from "@/lib/api/query-provider"
import { prePaintScript } from "@/i18n/locale-choice"
import { apiBaseUrl } from "@/lib/env"
import { fontStack } from "@/lib/font-stack"
import { cn } from "@/lib/utils"
import { ApiMocking } from "@/mocks/api-mocking"

import "./globals.css"

const fontText = Oxanium({ subsets: ["latin", "latin-ext"], variable: "--font-oxanium" })
const fontHeading = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist" })

const fontArabic = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-arabic",
  adjustFontFallback: false,
})

const fontStacks = {
  "--font-sans": fontStack(fontText, fontArabic),
  "--font-heading": fontStack(fontHeading, fontArabic),
} as React.CSSProperties

apiBaseUrl()

export const metadata: Metadata = {
  title: "KHMK Köln",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        fontText.variable,
        fontHeading.variable,
        fontArabic.variable,
        "font-sans"
      )}
      style={fontStacks}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prePaintScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          <ApiMocking>{children}</ApiMocking>
        </QueryProvider>
      </body>
    </html>
  )
}
