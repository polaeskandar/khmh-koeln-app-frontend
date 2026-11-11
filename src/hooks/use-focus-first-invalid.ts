"use client"

import { useEffect, useRef } from "react"

export function focusFirstInvalid(container: HTMLElement | null) {
  container?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}

export function useFocusFirstInvalid(problem: unknown) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (problem) {
      focusFirstInvalid(formRef.current)
    }
  }, [problem])

  return formRef
}
