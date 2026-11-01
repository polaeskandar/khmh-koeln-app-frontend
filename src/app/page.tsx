"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { KhmkMark } from "@/components/brand/logo"
import { localeToOpen, storedLocale } from "@/i18n/locale-choice"

export default function Root() {
  const router = useRouter()

  useEffect(() => {
    const locale = localeToOpen(window.location.pathname, storedLocale(), navigator.languages)
    router.replace(`/${locale}/`)
  }, [router])

  return (
    <main className="flex flex-1 items-center justify-center">
      <KhmkMark className="size-12" />
    </main>
  )
}
