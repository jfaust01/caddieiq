import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SplitViewProps {
  primary: React.ReactNode
  secondary?: React.ReactNode
  secondaryLabel?: string
  onSecondaryToggle?: (open: boolean) => void
  defaultSecondaryOpen?: boolean
  secondaryWidth?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SplitView({
  primary,
  secondary,
  secondaryLabel = 'Insights',
  onSecondaryToggle,
  defaultSecondaryOpen = true,
  secondaryWidth = 'md',
  className = '',
}: SplitViewProps) {
  const [secondaryOpen, setSecondaryOpen] = React.useState(
    defaultSecondaryOpen
  )

  const handleToggle = (open: boolean) => {
    setSecondaryOpen(open)
    onSecondaryToggle?.(open)
  }

  const widthClass = {
    sm: 'lg:w-80',
    md: 'lg:w-96',
    lg: 'lg:w-[28rem]',
  }

  return (
    <div className={`flex flex-col lg:flex-row gap-0 ${className}`}>
      {/* Primary content */}
      <div className="flex-1 min-w-0">{primary}</div>

      {/* Secondary sidebar */}
      {secondary && (
        <>
          {/* Mobile drawer toggle */}
          <div className="lg:hidden border-t border-border/50 mt-4 pt-4">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => handleToggle(!secondaryOpen)}
            >
              <span>{secondaryLabel}</span>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  secondaryOpen ? 'rotate-90' : ''
                }`}
              />
            </Button>

            {secondaryOpen && (
              <div className="mt-4 space-y-4">{secondary}</div>
            )}
          </div>

          {/* Desktop sidebar */}
          <div
            className={`hidden lg:block border-l border-border/50 ${widthClass[secondaryWidth]} p-4 bg-muted/20 overflow-y-auto`}
          >
            <h3 className="font-semibold mb-4">{secondaryLabel}</h3>
            <div className="space-y-4">{secondary}</div>
          </div>
        </>
      )}
    </div>
  )
}
