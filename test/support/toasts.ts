import { waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { expect, vi } from "vitest"

type ToastAction = { label: string; onClick: () => void }

const KINDS = ["success", "error"] as const

export function watchToasts() {
  for (const kind of KINDS) {
    vi.spyOn(toast, kind)
  }
}

const toastsShown = () => KINDS.flatMap((kind) => vi.mocked(toast[kind]).mock.calls)

const messagesShown = () => toastsShown().map(([message]) => message)

export async function expectToast(message: string, { timeout }: { timeout?: number } = {}) {
  await waitFor(() => expect(messagesShown()).toEqual(expect.arrayContaining([message])), {
    timeout,
  })
}

export async function expectOnlyToast(message: string) {
  await waitFor(() => expect(messagesShown()).toEqual([message]))
}

export function expectNoToast() {
  expect(messagesShown()).toEqual([])
}

export function clickToastAction(message: string, label: string) {
  const action = toastsShown()
    .filter(([shown]) => shown === message)
    .map(([, options]) => (options as { action?: ToastAction } | undefined)?.action)
    .find((candidate) => candidate?.label === label)

  if (!action) {
    throw new Error(`No “${label}” on the toast “${message}”`)
  }

  action.onClick()
}
