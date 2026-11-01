"use client"

import { useSearchParams } from "next/navigation"

import type { Uuid } from "@/lib/api/types/common"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function useSearchParamId(name = "id"): Uuid | null {
  const value = useSearchParams().get(name)

  return value !== null && UUID.test(value) ? value.toLowerCase() : null
}
