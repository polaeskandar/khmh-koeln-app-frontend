"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

import { THEME_COLORS } from "@/lib/theme-colors"

export function ThemeColor() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") {
      return
    }

    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", THEME_COLORS[resolvedTheme])
    }
  }, [resolvedTheme])

  return null
}
