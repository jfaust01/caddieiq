'use client'

import Image from 'next/image'
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
 * Always renders exactly one image:
 * - Valid country codes display the corresponding flag
 * - Invalid/null/unknown codes display the UN flag (neutral fallback)
 * - Failed image loads swap to fallback automatically
 */
export function PlayerFlag({ countryCode, className }: PlayerFlagProps) {
  const [showFallback, setShowFallback] = useState(false)
  
  const normalizedCode = normalizeCountryCode(countryCode)
  const flagUrl = normalizedCode
    ? `https://flagsapi.com/${normalizedCode}/shiny/64.png`
    : FALLBACK_FLAG_URL
  
  const currentUrl = showFallback ? FALLBACK_FLAG_URL : flagUrl
  const countryName = normalizedCode 
    ? getCountryName(normalizedCode)
    : 'Unknown country'

  return (
    <Image
      src={currentUrl}
      alt={countryName}
      width={16}
      height={16}
      loading="lazy"
      className={className}
      onError={() => {
        // Swap to fallback if image fails to load
        if (!showFallback) {
          setShowFallback(true)
        }
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
