"use client"

import { type ReactNode, useEffect, useState } from "react"

import { NotFoundPage } from "@/components/not-found-page"
import { useInBrowser } from "@/hooks/use-in-browser"

import { AuthFrame } from "./auth-frame"

type TokenChildren = { children: (token: string) => ReactNode }

const tokenInAddress = () => new URLSearchParams(window.location.hash.slice(1)).get("token") || null

function forgetAddressFragment() {
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + window.location.search
  )
}

function AddressToken({ children }: TokenChildren) {
  const [token] = useState(tokenInAddress)

  useEffect(forgetAddressFragment, [])

  return token === null ? <NotFoundPage /> : children(token)
}

export function AddressTokenGate({ children }: TokenChildren) {
  const inBrowser = useInBrowser()

  return inBrowser ? <AddressToken>{children}</AddressToken> : <AuthFrame>{null}</AuthFrame>
}
