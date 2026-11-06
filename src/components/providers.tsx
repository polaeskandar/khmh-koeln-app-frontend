"use client"

import { Direction } from "radix-ui"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ dir, children }: { dir: "ltr" | "rtl"; children: React.ReactNode }) {
  return (
    <Direction.Provider dir={dir}>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster position="top-center" dir={dir} />
      </TooltipProvider>
    </Direction.Provider>
  )
}
