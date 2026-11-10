import { renderHook } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { expect, test } from "vitest"

import { useInBrowser } from "@/hooks/use-in-browser"

function Where() {
  return <p>{useInBrowser() ? "browser" : "server"}</p>
}

test("it is false while the page is rendered ahead of time", () => {
  expect(renderToString(<Where />)).toContain("server")
})

test("it is true once the page runs in the browser", () => {
  expect(renderHook(() => useInBrowser()).result.current).toBe(true)
})
