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
