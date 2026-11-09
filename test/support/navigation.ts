import { createElement, useSyncExternalStore } from "react"
import { vi } from "vitest"

const listeners = new Set<() => void>()
let params = new URLSearchParams()

export const address = {
  get search() {
    return params.toString()
  },
  set(search: string) {
    params = new URLSearchParams(search)

    for (const listener of listeners) {
      listener()
    }
  },
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export const useSearchParamsMock = () => useSyncExternalStore(subscribe, () => params)

const go = (href: string) => address.set(href.split("?")[1] ?? "")

export const router = {
  push: vi.fn(go),
  replace: vi.fn(go),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

export const navigation = { pathname: "/" }

export const navigationMock = {
  useRouter: () => router,
  usePathname: () => navigation.pathname,
  Link: ({ href, ...props }: { href: string } & Record<string, unknown>) =>
    createElement("a", { href, ...props }),
}

export const searchParamsMock = { useSearchParams: useSearchParamsMock }
