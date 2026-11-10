"use client"

import { useRef } from "react"

type Options<Result> = { keepLocked?: (result: Result) => boolean }

export function useSubmitOnce<Args extends unknown[], Result>(
  run: (...args: Args) => Promise<Result>,
  { keepLocked }: Options<Result> = {}
): (...args: Args) => Promise<Result | undefined> {
  const running = useRef(false)

  return async (...args) => {
    if (running.current) {
      return undefined
    }

    running.current = true
    let locked = false

    try {
      const result = await run(...args)
      locked = keepLocked?.(result) ?? false

      return result
    } finally {
      running.current = locked
    }
  }
}
