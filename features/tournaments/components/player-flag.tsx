'use client'

import Image from 'next/image'
import { Globe2 } from 'lucide-react'
import { useState } from 'react'
import { normalizeCountryCode } from '@/lib/utils/normalize-country-code'

interface PlayerFlagProps {
  /** Country code (ISO 3166-1 Alpha-2) or country name to display flag for. */
  countryCode?: string | null
  /** Optional CSS class for additional styling. */
  className?: string
}

const FALLBACK_FLAG_URL = 'https://flagsapi.com/UN/shiny/64.png'

/**
 * Displays a country flag image from FlagsAPI.
 * 
 * Renders either:
 * - Valid country flag image (16x16px)
 * - Globe icon fallback when:
 *   - Country code is missing or null
 *   - Country code is invalid
 *   - Flag image fails to load
 * 
 * The globe icon is muted, same size as flag, and centered.
 */
export function PlayerFlag({ countryCode, className }: PlayerFlagProps) {
  const [showGlobeFallback, setShowGlobeFallback] = useState(false)
  
  const normalizedCode = normalizeCountryCode(countryCode)
  const countryName = normalizedCode 
    ? getCountryName(normalizedCode)
    : 'Country unavailable'
  
  // Show globe icon immediately if no valid country code
  if (!normalizedCode || showGlobeFallback) {
    return (
      <Globe2
        size={16}
        className={`text-muted-foreground ${className || ''}`}
        aria-label="Country unavailable"
        title="Country unavailable"
      />
    )
  }

  const flagUrl = `https://flagsapi.com/${normalizedCode}/shiny/64.png`

  return (
    <Image
      src={flagUrl}
      alt={countryName}
      width={16}
      height={16}
      loading="lazy"
      className={className}
      onError={() => {
        // Swap to globe fallback if image fails to load
        setShowGlobeFallback(true)
      }}
    />
  )
}

/**
 * Get friendly country name for a given ISO code.
 */
function getCountryName(code: string): string {
  const countryNames: Record<string, string> = {
    'US': 'United States',
    'GB': 'Great Britain',
    'AU': 'Australia',
    'CA': 'Canada',
    'MX': 'Mexico',
    'JP': 'Japan',
    'ES': 'Spain',
    'FR': 'France',
    'DE': 'Germany',
    'IT': 'Italy',
    'ZA': 'South Africa',
    'KR': 'South Korea',
    'IE': 'Ireland',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'PT': 'Portugal',
    'GR': 'Greece',
    'CZ': 'Czech Republic',
    'PL': 'Poland',
    'HU': 'Hungary',
    'RO': 'Romania',
    'TH': 'Thailand',
    'SG': 'Singapore',
    'CN': 'China',
    'IN': 'India',
    'BR': 'Brazil',
    'AR': 'Argentina',
    'CL': 'Chile',
    'NZ': 'New Zealand',
    'HK': 'Hong Kong',
    'TW': 'Taiwan',
    'MY': 'Malaysia',
    'ID': 'Indonesia',
    'PH': 'Philippines',
    'VN': 'Vietnam',
    'TR': 'Turkey',
    'SA': 'Saudi Arabia',
    'AE': 'United Arab Emirates',
    'IL': 'Israel',
    'EG': 'Egypt',
    'SS': 'South Sudan',
    'KE': 'Kenya',
    'UN': 'United Nations',
  }
  return countryNames[code] ?? code
}
