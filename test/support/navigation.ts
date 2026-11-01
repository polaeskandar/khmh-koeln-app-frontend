import { createElement } from "react"
import { vi } from "vitest"

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
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
