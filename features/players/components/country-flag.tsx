import type { Nationality } from '@/features/players/types'
import { cn } from '@/lib/utils'

interface CountryFlagProps {
  /** Resolved nationality, or null when the player has no linked country. */
  nationality: Nationality | null
  /** Show the full country name next to the code. */
  showName?: boolean
  className?: string
}

/**
 * Country flag placeholder. Renders the ISO code in a compact chip instead of a
 * real flag image (no external assets yet). When nationality is unknown it
 * renders a neutral placeholder rather than fabricating a country.
 *
 * TODO(data): swap the code chip for a real flag asset once available.
 */
export function CountryFlag({
  nationality,
  showName = false,
  className,
}: CountryFlagProps) {
  if (!nationality) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <span
          aria-hidden
          className="inline-flex h-4 min-w-7 items-center justify-center rounded-[3px] bg-muted px-1 text-[10px] font-semibold tracking-wide text-muted-foreground"
        >
          ??
        </span>
        {showName ? (
          <span className="text-sm text-muted-foreground">Unknown</span>
        ) : (
          <span className="sr-only">Unknown nationality</span>
        )}
      </span>
    )
  }

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      title={nationality.name}
    >
      <span
        aria-hidden
        className="inline-flex h-4 min-w-7 items-center justify-center rounded-[3px] bg-muted px-1 text-[10px] font-semibold tracking-wide text-muted-foreground tabular-nums"
      >
        {nationality.code}
      </span>
      {showName ? (
        <span className="text-sm text-muted-foreground">{nationality.name}</span>
      ) : (
        <span className="sr-only">{nationality.name}</span>
      )}
    </span>
  )
}
