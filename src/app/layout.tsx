import type { Metadata } from "next"
import { Geist, Oxanium } from "next/font/google"

import { cn } from "@/lib/utils"

import "./globals.css"

const fontSans = Oxanium({ subsets: ["latin", "latin-ext"], variable: "--font-sans" })
const fontHeading = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-heading" })

export const metadata: Metadata = {
  title: "KHMK Köln",
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", fontSans.variable, fontHeading.variable, "font-sans")}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
