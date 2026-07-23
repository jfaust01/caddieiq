import Image from 'next/image'

type DraftKingsMarkProps = {
  className?: string
}

/**
 * DraftKings brand mark component
 * Replaces text "DK" labels with the official DraftKings logo
 * Used throughout tournament UI for consistent branding
 */
export function DraftKingsMark({
  className = 'h-4 w-auto',
}: DraftKingsMarkProps) {
  return (
    <Image
      src="/draftkings-logo.svg"
      alt="DraftKings"
      width={48}
      height={32}
      className={`inline-block shrink-0 object-contain ${className}`}
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
      <DraftKingsMark className="h-[18px] w-auto" />
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
      <DraftKingsMark className="h-5 w-auto" />
      <span>{label}</span>
    </div>
  )
}
