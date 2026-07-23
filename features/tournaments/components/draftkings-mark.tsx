import Image from 'next/image'

interface DraftKingsMarkProps {
  className?: string
  variant?: 'inline' | 'header'
}

/**
 * DraftKings brand mark component
 * Replaces text "DK" labels with the official DraftKings logo
 * Used throughout tournament UI for consistent branding
 */
export function DraftKingsMark({
  className = 'h-4 w-auto',
  variant = 'inline',
}: DraftKingsMarkProps) {
  const classNames = {
    inline: 'h-3.5 sm:h-4 w-auto',
    header: 'h-4 sm:h-5 w-auto',
  }

  return (
    <Image
      src="/draftkings-logo.svg"
      alt="DraftKings"
      height={16}
      width={16}
      className={className || classNames[variant]}
      unoptimized
    />
  )
}

/**
 * Wrapper for DK values (salary, points, etc.)
 * Combines the logo with the numeric value inline
 */
export function DKValue({
  value,
  label,
  className = '',
}: {
  value: string | number
  label?: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <DraftKingsMark variant="inline" />
      <span>
        {label && <span className="text-[#9EA5B1]">{label}</span>}
        {value}
      </span>
    </div>
  )
}

/**
 * Header label combining logo with text
 * Used for table headers and section titles
 */
export function DKLabel({
  label,
  className = '',
}: {
  label: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <DraftKingsMark variant="header" />
      <span>{label}</span>
    </div>
  )
}
