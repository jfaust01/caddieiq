"use client"

import * as React from "react"
import { HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Explanation } from "@/lib/explainability"

import { ExplanationBreakdown } from "./explanation-breakdown"

export interface WhyButtonProps {
  /** The explanation to reveal. Narrated automatically if it has no prose yet. */
  explanation: Explanation
  /** Optional trigger label (defaults to "Why?"). */
  label?: string
  /** Screen-reader context appended to the trigger's accessible name. */
  srContext?: string
  className?: string
}

/**
 * The single "Why?" affordance reused across every score surface. It reveals a
 * model's {@link ExplanationBreakdown} in a popover on desktop and a bottom
 * sheet on mobile, so the same grounded explanation reads well on any device.
 */
export function WhyButton({ explanation, label = "Why?", srContext, className }: WhyButtonProps) {
  const isMobile = useIsMobile()
  const accessibleName = srContext
    ? `${label} — ${explanation.model.label} for ${srContext}`
    : `${label} — ${explanation.model.label} explanation`

  const trigger = (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      aria-label={accessibleName}
    >
      <HelpCircle data-icon="inline-start" />
      {label}
    </Button>
  )

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger render={trigger} />
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader>
            <SheetTitle>Why this score?</SheetTitle>
            <SheetDescription>
              How {explanation.model.label} was computed, and what it relies on.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1 px-4 pb-6">
            <ExplanationBreakdown explanation={explanation} />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <ScrollArea className="max-h-[70vh]">
          <ExplanationBreakdown explanation={explanation} className="p-4" />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
