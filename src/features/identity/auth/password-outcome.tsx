"use client"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

export function SignInButton({ label }: { label: string }) {
  return (
    <Button asChild className="self-start">
      <Link href={routes.signIn()}>{label}</Link>
    </Button>
  )
}
