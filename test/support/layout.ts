import { expect } from "vitest"

export function expectTouchTarget(element: Element) {
  expect(element).toHaveClass("min-h-11", "min-w-11")
}

export function expectFullWidthOnPhones(element: Element) {
  expect(element).toHaveClass("w-full", "sm:w-auto")
}

export function expectWrapsInsideItsColumn(element: Element) {
  expect(element).toHaveClass("shrink", "whitespace-normal")
  expect(element).not.toHaveClass("shrink-0", "whitespace-nowrap")
}

export function expectKeepsLineBreaks(element: Element) {
  expect(element).toHaveClass("whitespace-pre-line")
}

export function expectOnlyBelowMd(element: Element) {
  expect(element).toHaveClass("md:hidden")
}

export function expectOnlyFromMd(element: Element) {
  expect(element).toHaveClass("hidden", "md:flex")
}

export function expectScrollsSideways(element: Element) {
  expect(element).toHaveClass("overflow-x-auto")
}

export function expectNeverScrollsVertically(element: Element) {
  expect(element).toHaveClass("overflow-y-hidden")
}

export function expectMirroredInRtl(element: Element) {
  expect(element).toHaveClass("rtl:rotate-180")
}

export function expectVisuallyHidden(element: Element) {
  expect(element).toHaveClass("sr-only")
}

export function expectClearOfCloseButton(element: Element) {
  expect(element).toHaveClass("pe-8")
}

export function expectTheme(theme: "dark" | "light") {
  expect(document.documentElement.classList.contains("dark")).toBe(theme === "dark")
}
