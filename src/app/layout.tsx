import type { Metadata, Viewport } from "next"
import { Geist, Oxanium } from "next/font/google"

import { QueryProvider } from "@/lib/api/query-provider"
import { prePaintScript } from "@/i18n/locale-choice"
import { apiBaseUrl } from "@/lib/env"
import { cn } from "@/lib/utils"
import { ApiMocking } from "@/mocks/api-mocking"

import "./globals.css"

const fontSans = Oxanium({ subsets: ["latin", "latin-ext"], variable: "--font-sans" })
const fontHeading = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-heading" })

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
      className={cn("h-full antialiased", fontSans.variable, fontHeading.variable, "font-sans")}
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
