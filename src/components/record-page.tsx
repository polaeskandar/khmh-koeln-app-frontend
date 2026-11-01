"use client"

import { type ReactNode, Suspense } from "react"

import { useSearchParamId } from "@/hooks/use-search-param-id"
import type { Uuid } from "@/lib/api/types/common"

type Props = {
  param?: string
  notFound: ReactNode
  fallback?: ReactNode
  children: (id: Uuid) => ReactNode
}

export function RecordPage({ param = "id", notFound, fallback = null, children }: Props) {
  return (
    <Suspense fallback={fallback}>
      <Record param={param} notFound={notFound}>
        {children}
      </Record>
    </Suspense>
  )
}

function Record({ param, notFound, children }: Omit<Props, "fallback"> & { param: string }) {
  const id = useSearchParamId(param)

  return id === null ? notFound : children(id)
}
