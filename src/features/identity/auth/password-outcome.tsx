"use client"

import { cn } from "@/lib/utils"
import { KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

export function StateIcon({ icon: Icon, tone }: { icon: typeof KeyRound; tone: string }) {
  return (
    <span className={cn("inline-flex size-11 items-center justify-center", tone)}>
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}

export function SignInButton({ label }: { label: string }) {
  return (
    <Button asChild className="self-start">
      <Link href={routes.signIn()}>{label}</Link>
    </Button>
  )
}
