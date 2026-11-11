"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { useRouter } from "@/i18n/navigation"
import { oneOf } from "@/lib/one-of"
import { routes } from "@/lib/routes"

const SEARCH_DELAY_MS = 300

type Status = "active" | "inactive" | "all"

export const STATUSES: Status[] = ["active", "inactive", "all"]

type ListView = { q: string; group: string; status: Status }

type Show = (next: Partial<ListView>, history: "push" | "replace") => void

const viewOf = (params: URLSearchParams): ListView => ({
  q: params.get("q")?.trim() ?? "",
  group: params.get("group") ?? "",
  status: oneOf(STATUSES, params.get("status")) ?? "active",
})

const addressOf = (view: ListView) =>
  routes.members({
    q: view.q || null,
    group: view.group || null,
    status: view.status === "active" ? null : view.status,
  })

export function useListView() {
  const params = useSearchParams()
  const router = useRouter()
  const requested = useRef("")

  const show = useCallback<Show>(
    (next, history) => {
      const current = viewOf(params)
      const address = addressOf({ ...current, ...next })
      const request = `${params.toString()} ${address}`

      if (address === addressOf(current) || requested.current === request) {
        return
      }

      requested.current = request
      router[history](address, { scroll: false })
    },
    [params, router]
  )

  return [viewOf(params), show] as const
}

export function useSearchField(q: string, show: Show) {
  const [text, setText] = useState(q)
  const [seen, setSeen] = useState(q)
  const [sent, setSent] = useState<string | null>(null)

  if (seen !== q) {
    setSeen(q)

    if (q === sent) {
      setSent(null)
    } else {
      setText(q)
    }
  }

  useEffect(() => {
    const term = text.trim()

    if (term === q) {
      return
    }

    const timer = setTimeout(() => {
      setSent(term)
      show({ q: term }, "replace")
    }, SEARCH_DELAY_MS)

    return () => clearTimeout(timer)
  }, [text, q, show])

  const clear = () => {
    setText("")

    if (q !== "") {
      setSent("")
      show({ q: "" }, "replace")
    }
  }

  return { text, setText, clear }
}

export function usePaging(filterKey: string) {
  const [paging, setPaging] = useState({ key: filterKey, page: 1 })

  if (paging.key !== filterKey) {
    setPaging({ key: filterKey, page: 1 })
  }

  const page = paging.key === filterKey ? paging.page : 1
  const setPage = (next: number) => setPaging({ key: filterKey, page: next })

  return [page, setPage] as const
}
