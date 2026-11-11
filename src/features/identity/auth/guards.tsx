"use client"

import { UserRoundX } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { type ReactNode, useEffect, useState } from "react"

import { KhmkMark } from "@/components/brand/logo"
import { NoAccess } from "@/components/no-access"
import { NotAssigned } from "@/components/not-assigned"
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
import type { Action, Resource } from "@/features/identity/roles/api"
import { GROUP_RESOURCES } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { LANGUAGE_APPLIED_KEY, markLanguageApplied } from "./account-language"
import type { areasOf, Me } from "./api"
import { safeNext } from "./safe-next"
import { useCan, useSession, useUnassigned } from "./session"

type Areas = ReturnType<typeof areasOf>

function SessionSplash() {
  return (
    <main aria-busy="true" className="flex min-h-svh flex-1 items-center justify-center">
      <KhmkMark className="size-12" />
    </main>
  )
}

function NoRole() {
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

function homeOf(areas: Areas) {
  if (areas.staff) {
    return routes.home()
  }

  return areas.parent ? routes.parentHome() : routes.memberHome()
}

const hasArea = (areas: Areas) => areas.staff || areas.parent || areas.member

function Guard({ allows, children }: { allows: (areas: Areas) => boolean; children: ReactNode }) {
  const { session, refresh } = useSession()

  if (session.status === "unknown" || session.status === "ended") {
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

  if (!hasArea(areas)) {
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
    markLanguageApplied(queryClient, me.account.id)

    if (switchTo) {
      storeLocale(switchTo)
    }
  }, [queryClient, me.account.id, switchTo])

  if (switchTo) {
    return <Redirect to={`${pathname}${window.location.search}`} locale={switchTo} />
  }

  return children
}

export function RequireStaff({ children }: { children: ReactNode }) {
  return <Guard allows={(areas) => areas.staff}>{children}</Guard>
}

export function RequireParent({ children }: { children: ReactNode }) {
  return <Guard allows={(areas) => areas.parent}>{children}</Guard>
}

export function RequireMember({ children }: { children: ReactNode }) {
  return <Guard allows={(areas) => areas.member}>{children}</Guard>
}

export function RequirePermission({
  action,
  resource,
  fallback,
  children,
}: {
  action: Action
  resource: Resource
  fallback?: ReactNode
  children: ReactNode
}) {
  const t = useTranslations("errors")
  const can = useCan()
  const unassigned = useUnassigned()

  if (can(action, resource)) {
    return children
  }

  if (unassigned && GROUP_RESOURCES.includes(resource)) {
    return <NotAssigned />
  }

  if (fallback !== undefined) {
    return fallback
  }

  return <NoAccess title={t("title.forbidden")}>{t("forbidden")}</NoAccess>
}

export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const { session } = useSession()

  if (session.status === "unknown") {
    return <SessionSplash />
  }

  if (session.status !== "authenticated") {
    return children
  }

  const { areas } = session

  if (!hasArea(areas)) {
    return <NoRole />
  }

  const next = safeNext(new URLSearchParams(window.location.search).get("next"))

  if (!next) {
    return <Redirect to={homeOf(areas)} />
  }

  const [, locale, ...rest] = next.split("/")

  return <Redirect to={`/${rest.join("/")}`} locale={isLocale(locale) ? locale : undefined} />
}
