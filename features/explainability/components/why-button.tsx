"use client"

import * as React from "react"
import { HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Explanation } from "@/lib/explainability"

import { DecisionTraceTimeline } from "./decision-trace-timeline"

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
 * model's {@link DecisionTraceTimeline} in a centered modal dialog on desktop
 * and a bottom sheet on mobile.
 *
 * Both surfaces are height-capped at 90vh and laid out as a flex column: a fixed
 * header and footer bracket a single scrollable body (`flex-1 min-h-0
 * overflow-y-auto`), so only the trace scrolls — never the page. Both primitives
 * are Base UI dialogs, which provide focus trapping, ESC-to-close, ARIA wiring,
 * and background scroll-lock; `overscroll-contain` stops scroll chaining and the
 * scroll region is focusable so keyboard, wheel, and touch scrolling all work.
 */
export function WhyButton({ explanation, label = "Why?", srContext, className }: WhyButtonProps) {
  const isMobile = useIsMobile()
  const accessibleName = srContext
    ? `${label} — ${explanation.model.label} for ${srContext}`
    : `${label} — ${explanation.model.label} explanation`
  const descriptionText = `The step-by-step trace of how ${explanation.model.label} reached this result.`

  const trigger = (
    <Button variant="ghost" size="sm" className={className} aria-label={accessibleName}>
      <HelpCircle data-icon="inline-start" />
      {label}
    </Button>
  )

  /** The scrollable trace body, shared by both surfaces. */
  const body = (
    <div
      tabIndex={0}
      role="region"
      aria-label="Decision trace"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <DecisionTraceTimeline explanation={explanation} />
    </div>
  )

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger render={trigger} />
        <SheetContent side="bottom" className="flex max-h-[90vh] flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b pr-12">
            <SheetTitle>How this was decided</SheetTitle>
            <SheetDescription>{descriptionText}</SheetDescription>
          </SheetHeader>
          {body}
          <SheetFooter className="shrink-0 flex-row justify-end border-t p-3">
            <SheetClose render={<Button variant="outline" size="sm" />}>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b p-4 pr-12">
          <DialogTitle>How this was decided</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>
        {body}
        <DialogFooter className="m-0 shrink-0 rounded-none border-t bg-transparent p-3">
          <DialogClose render={<Button variant="outline" size="sm" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
