const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path)

export function isActive(href: string, pathname: string | null | undefined, home = "/"): boolean {
  if (!pathname) {
    return false
  }

  const item = trimSlash(href)
  const path = trimSlash(pathname.split("?")[0])

  if (item === trimSlash(home)) {
    return path === item
  }

  return path === item || path.startsWith(`${item}/`)
}
