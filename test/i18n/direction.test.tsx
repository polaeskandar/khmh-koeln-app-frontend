import { renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test } from "vitest"

import { Providers } from "@/components/providers"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isolate } from "@/lib/bidi"
import { renderWithProviders, testProviders } from "@test/support/providers"

import { useInlineEnd, useInlineStart } from "@/i18n/direction"

describe("physical sides follow the language", () => {
  test.each([
    ["en", "right", "left"],
    ["de", "right", "left"],
    ["ar", "left", "right"],
  ] as const)("in %s lines end on the %s", (locale, end, start) => {
    const { wrapper } = testProviders({ locale })
    expect(renderHook(() => useInlineEnd(), { wrapper }).result.current).toBe(end)
    expect(renderHook(() => useInlineStart(), { wrapper }).result.current).toBe(start)
  })
})

test("isolate wraps typed text in FSI … PDI", () => {
  expect(isolate("Marina is away.")).toBe("⁨Marina is away.⁩")
})

test("a Radix DropdownMenu runs right to left under Arabic", async () => {
  renderWithProviders(
    <Providers dir="rtl">
      <DropdownMenu>
        <DropdownMenuTrigger>القائمة</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>عنصر</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Providers>,
    { locale: "ar" }
  )

  await userEvent.click(screen.getByRole("button", { name: "القائمة" }))
  expect(screen.getByRole("menu")).toHaveAttribute("dir", "rtl")
})
