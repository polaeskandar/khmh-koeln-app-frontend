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
import { translateProblem } from "@/lib/api/translate-problem"
import { useProblemTranslator } from "@/lib/api/use-problem-translator"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { can, type Can, canAssign, type Group, isUnassigned, within } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { onLanguageSaveFailed } from "./account-language"
import { areasOf, type Me, meQuery, signOutRequest } from "./api"

type Session =
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
  endSession: (to: string) => void
}

const Context = createContext<SessionContext | null>(null)

function sessionOf(
  closed: boolean,
  query: { data: Me | undefined; error: unknown; isError: boolean }
): Session {
  if (closed) {
    return { status: "ended" }
  }

  if (query.error instanceof ApiError && query.error.status === 401) {
    return { status: "anonymous" }
  }

  if (query.data) {
    return { status: "authenticated", me: query.data, areas: areasOf(query.data) }
  }

  return query.isError ? { status: "failed", error: query.error } : { status: "unknown" }
}

const currentPath = () => `${window.location.pathname}${window.location.search}`

export function SessionProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("errors")
  const router = useRouter()
  const queryClient = useQueryClient()
  const [closed, setClosed] = useState(false)
  const query = useQuery({ ...meQuery, enabled: !closed })

  const session = sessionOf(closed, query)

  const signedIn = useRef(false)
  const ended = useRef(false)

  useEffect(() => {
    signedIn.current = session.status === "authenticated"

    if (signedIn.current) {
      ended.current = false
    }
  }, [session.status])

  const endSession = useCallback(
    (to: string) => {
      ended.current = true
      setClosed(true)
      queryClient.clear()
      router.replace(to)
    },
    [queryClient, router]
  )

  const end = useCallback(
    (next: string | undefined) => endSession(routes.signIn(next)),
    [endSession]
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
  const tAll = useProblemTranslator()

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
    <Context.Provider value={{ session, refresh, signOut, signingOut: pending, endSession }}>
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

function useMe() {
  const { session } = useSession()

  return session.status === "authenticated" ? session.me : null
}

export function useCan(): Can {
  const me = useMe()

  return (action, resource, group) => can(me, action, resource, group)
}

export function useCanIn(group: Group | undefined): Can {
  return within(useCan(), group)
}

export function useCanAssign(): (group?: Group) => boolean {
  const me = useMe()

  return (group) => canAssign(me, group)
}

export function useUnassigned(): boolean {
  return isUnassigned(useMe())
}
