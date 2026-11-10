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

const useSearchParamsMock = () => useSyncExternalStore(subscribe, () => params)

export const navigation = { pathname: "/" }

function go(href: string) {
  const url = new URL(href, `http://localhost${navigation.pathname}`)

  if (url.pathname === navigation.pathname) {
    address.set(url.search)
  }
}

export const router = {
  push: vi.fn(go),
  replace: vi.fn(go),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

const linkOnlyProps = new Set(["locale", "prefetch", "replace", "scroll", "shallow"])

export const navigationMock = {
  useRouter: () => router,
  usePathname: () => navigation.pathname,
  Link: ({ href, ...props }: { href: string } & Record<string, unknown>) =>
    createElement("a", {
      href,
      ...Object.fromEntries(Object.entries(props).filter(([name]) => !linkOnlyProps.has(name))),
    }),
}

export const nextNavigationMock = {
  useRouter: () => router,
  usePathname: () => navigation.pathname,
  useSearchParams: useSearchParamsMock,
}

export function resetNavigation() {
  address.set("")
  navigation.pathname = "/"

  for (const mock of Object.values(router)) {
    mock.mockReset()
  }
}
