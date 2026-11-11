"use client"

import { createContext, type ReactNode, use, useState } from "react"

type Mount = { open: boolean; onClosed: () => void }

const MountContext = createContext<Mount>({ open: true, onClosed: () => {} })

export function DialogMount({ open, children }: { open: boolean; children: ReactNode }) {
  const [opened, setOpened] = useState(open)
  const [mount, setMount] = useState({ opening: 0, shown: open })

  if (open !== opened) {
    setOpened(open)

    if (open) {
      setMount({ opening: mount.opening + 1, shown: true })
    }
  }

  if (!mount.shown) {
    return null
  }

  const { opening } = mount

  function closed() {
    setMount((current) => (current.opening === opening ? { opening, shown: false } : current))
  }

  return (
    <MountContext key={opening} value={{ open, onClosed: closed }}>
      {children}
    </MountContext>
  )
}

export function useDialogMount() {
  const { open, onClosed } = use(MountContext)

  function closeAutoFocus() {
    if (!open) {
      onClosed()
    }
  }

  return { open, onCloseAutoFocus: closeAutoFocus }
}
