"use client"

import { useEffect } from "react"

import { directionOf, type Locale } from "./config"

export function HtmlLangDir({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = directionOf(locale)
  }, [locale])

  return null
}
