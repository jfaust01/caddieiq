'use client'

import type { ReactNode } from 'react'

import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <TooltipProvider delay={200}>
          {children}
          <Toaster />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
