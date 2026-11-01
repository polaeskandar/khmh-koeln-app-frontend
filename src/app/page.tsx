"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { DEFAULT_LOCALE } from "@/i18n/config"

export default function Root() {
  const router = useRouter()
  useEffect(() => router.replace(`/${DEFAULT_LOCALE}/`), [router])

  return null
}
