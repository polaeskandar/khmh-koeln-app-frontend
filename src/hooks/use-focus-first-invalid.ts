"use client"

import { useEffect, useRef } from "react"

import { focusFirstInvalid } from "@/components/focus-first-invalid"

export function useFocusFirstInvalid(problem: unknown) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (problem) {
      focusFirstInvalid(formRef.current)
    }
  }, [problem])

  return formRef
}
