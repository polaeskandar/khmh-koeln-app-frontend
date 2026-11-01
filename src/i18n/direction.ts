import { useLocale } from "next-intl"

import { directionOf } from "./config"

export function useDirection(): "ltr" | "rtl" {
  return directionOf(useLocale())
}

export function useInlineEnd(): "left" | "right" {
  return useDirection() === "rtl" ? "left" : "right"
}

export function useInlineStart(): "left" | "right" {
  return useDirection() === "rtl" ? "right" : "left"
}
