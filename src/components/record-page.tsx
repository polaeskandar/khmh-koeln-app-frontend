"use client"

import { type ReactNode, Suspense } from "react"

import { useSearchParamId } from "@/hooks/use-search-param-id"
import type { Uuid } from "@/lib/api/types/common"

type Props = {
  param?: string
  notFound: ReactNode
  children: (id: Uuid) => ReactNode
}

export function RecordPage({ param = "id", notFound, children }: Props) {
  return (
    <Suspense>
      <Record param={param} notFound={notFound}>
        {children}
      </Record>
    </Suspense>
  )
}

function Record({ param, notFound, children }: Props & { param: string }) {
  const id = useSearchParamId(param)

  return id === null ? notFound : children(id)
}
