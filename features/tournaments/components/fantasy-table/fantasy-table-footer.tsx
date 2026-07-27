'use client'

interface FantasyTableFooterProps {
  footnote: string
}

/**
 * Table footer with phase-specific footnote.
 */
export function FantasyTableFooter({ footnote }: FantasyTableFooterProps) {
  return <div className="text-xs text-muted-foreground italic">{footnote}</div>
}
