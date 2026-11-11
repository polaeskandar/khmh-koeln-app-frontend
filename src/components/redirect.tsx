"use client"

import { useEffect } from "react"

import { useRouter } from "@/i18n/navigation"

export function Redirect({ to }: { to: string }) {
  const router = useRouter()

  useEffect(() => router.replace(to), [router, to])

  return null
}
