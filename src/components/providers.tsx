"use client"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ dir, children }: { dir: "ltr" | "rtl"; children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      {children}
      <Toaster position="top-center" dir={dir} />
    </TooltipProvider>
  )
}
