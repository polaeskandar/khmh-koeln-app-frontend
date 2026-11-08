"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { toast } from "sonner"

import { useRouter } from "@/i18n/navigation"
import { onUnauthorized } from "@/lib/api/client"
import { ApiError } from "@/lib/api/problem"
import { type ProblemTranslator, translateProblem } from "@/lib/api/translate-problem"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { can, type Can } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { onLanguageSaveFailed } from "@/features/identity/account-language"
import { areasOf, type Me, meQuery, signOutRequest } from "@/features/identity/api"

export type Session =
  | { status: "unknown" }
  | { status: "anonymous" }
  | { status: "ended" }
  | { status: "authenticated"; me: Me; areas: ReturnType<typeof areasOf> }
  | { status: "failed"; error: unknown }

type SessionContext = {
  session: Session
  refresh: () => Promise<unknown>
  signOut: () => Promise<void>
  signingOut: boolean
}

const Context = createContext<SessionContext | null>(null)

const currentPath = () => `${window.location.pathname}${window.location.search}`

export function SessionProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("errors")
  const router = useRouter()
  const queryClient = useQueryClient()
  const [closed, setClosed] = useState(false)
  const query = useQuery({ ...meQuery, enabled: !closed })

  const session: Session = closed
    ? { status: "ended" }
    : query.error instanceof ApiError && query.error.status === 401
      ? { status: "anonymous" }
      : query.data
        ? { status: "authenticated", me: query.data, areas: areasOf(query.data) }
        : query.isError
          ? { status: "failed", error: query.error }
          : { status: "unknown" }

  const signedIn = useRef(false)
  const ended = useRef(false)

  useEffect(() => {
    signedIn.current = session.status === "authenticated"

    if (signedIn.current) {
      ended.current = false
    }
  }, [session.status])

  const end = useCallback(
    (next: string | undefined) => {
      ended.current = true
      setClosed(true)
      queryClient.clear()
      router.replace(routes.signIn(next))
    },
    [queryClient, router]
  )

  useEffect(
    () =>
      onUnauthorized(() => {
        if (!signedIn.current || ended.current) {
          return
        }

        toast.error(t("sessionExpired"))
        end(currentPath())
      }),
    [end, t]
  )

  const { refetch } = query

  const refresh = useCallback(() => {
    setClosed(false)

    return refetch()
  }, [refetch])

  const locale = useLocale()
  const tAll = useTranslations() as unknown as ProblemTranslator

  useEffect(
    () =>
      onLanguageSaveFailed((language, error) => {
        if (language !== locale) {
          return false
        }

        toast.error(
          error instanceof ApiError ? translateProblem(error, tAll) : tAll("errors.internal")
        )

        return true
      }),
    [locale, tAll]
  )

  const { execute, pending } = useApiMutation(signOutRequest)

  const signOut = useCallback(async () => {
    ended.current = true
    const result = await execute()

    if (result.ok || result.problem.status === 401) {
      end(undefined)
    } else {
      ended.current = false
    }
  }, [execute, end])

  return (
    <Context.Provider value={{ session, refresh, signOut, signingOut: pending }}>
      {children}
    </Context.Provider>
  )
}

export function useSession(): SessionContext {
  const context = useContext(Context)

  if (!context) {
    throw new Error("useSession() needs a SessionProvider above it.")
  }

  return context
}

export function useCan(): Can {
  const { session } = useSession()
  const me = session.status === "authenticated" ? session.me : null

  return (action, resource) => can(me, action, resource)
}
