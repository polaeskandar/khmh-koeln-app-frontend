"use client"

import { UserRoundX } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { type ReactNode, useEffect, useState } from "react"

import { KhmkMark } from "@/components/brand/logo"
import { QueryErrorState } from "@/components/page-states"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { isLocale, type Locale } from "@/i18n/config"
import { storeLocale } from "@/i18n/locale-choice"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import { LANGUAGE_APPLIED_KEY } from "./account-language"
import type { areasOf, Me } from "./api"
import { useSession } from "./session"

type Areas = ReturnType<typeof areasOf>

export function SessionSplash() {
  return (
    <main aria-busy="true" className="flex min-h-svh flex-1 items-center justify-center">
      <KhmkMark className="size-12" />
    </main>
  )
}

export function NoRole() {
  const t = useTranslations("auth.noRole")
  const { signOut, signingOut } = useSession()

  return (
    <main className="flex min-h-svh flex-1 items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserRoundX />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("text")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" disabled={signingOut} onClick={() => signOut()}>
            {t("signOut")}
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}

function Redirect({ to, locale }: { to: string; locale?: Locale }) {
  const router = useRouter()

  useEffect(() => {
    if (locale) {
      router.replace(to, { locale })
    } else {
      router.replace(to)
    }
  }, [router, to, locale])

  return <SessionSplash />
}

const homeOf = (areas: Areas) => (areas.staff ? routes.home() : routes.parentHome())

function Guard({ allows, children }: { allows: (areas: Areas) => boolean; children: ReactNode }) {
  const { session, refresh } = useSession()

  if (session.status === "unknown") {
    return <SessionSplash />
  }

  if (session.status === "failed") {
    return (
      <main className="flex min-h-svh flex-1 items-center justify-center p-6">
        <QueryErrorState error={session.error} onRetry={refresh} />
      </main>
    )
  }

  if (session.status === "anonymous") {
    return <Redirect to={routes.signIn(`${window.location.pathname}${window.location.search}`)} />
  }

  const { areas } = session

  if (!areas.staff && !areas.parent) {
    return <NoRole />
  }

  if (!allows(areas)) {
    return <Redirect to={homeOf(areas)} />
  }

  return <AccountLanguage me={session.me}>{children}</AccountLanguage>
}

function AccountLanguage({ me, children }: { me: Me; children: ReactNode }) {
  const queryClient = useQueryClient()
  const locale = useLocale()
  const pathname = usePathname()

  const [switchTo] = useState(() =>
    !queryClient.getQueryData(LANGUAGE_APPLIED_KEY) &&
    isLocale(me.account.language) &&
    me.account.language !== locale
      ? me.account.language
      : null
  )

  useEffect(() => {
    queryClient.setQueryData(LANGUAGE_APPLIED_KEY, me.account.id)

    if (switchTo) {
      storeLocale(switchTo)
    }
  }, [queryClient, me.account.id, switchTo])

  if (switchTo) {
    return <Redirect to={`${pathname}${window.location.search}`} locale={switchTo} />
  }

  return children
}

export const RequireStaff = ({ children }: { children: ReactNode }) => (
  <Guard allows={(areas) => areas.staff}>{children}</Guard>
)

export const RequireParent = ({ children }: { children: ReactNode }) => (
  <Guard allows={(areas) => areas.parent}>{children}</Guard>
)

export const RequireAdministrator = ({ children }: { children: ReactNode }) => (
  <Guard allows={(areas) => areas.administrator}>{children}</Guard>
)

export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const { session } = useSession()

  if (session.status === "unknown") {
    return <SessionSplash />
  }

  if (session.status !== "authenticated") {
    return children
  }

  const { areas } = session

  return areas.staff || areas.parent ? <Redirect to={homeOf(areas)} /> : <NoRole />
}
