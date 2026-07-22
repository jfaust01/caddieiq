/**
 * Normalize country names and variations to ISO 3166-1 Alpha-2 codes.
 */

const countryNameToCodeMap: Record<string, string> = {
  // Common names and variations
  'USA': 'US',
  'UNITED STATES': 'US',
  'US': 'US',
  'AUSTRALIA': 'AU',
  'AU': 'AU',
  'UNITED KINGDOM': 'GB',
  'UK': 'GB',
  'GREAT BRITAIN': 'GB',
  'ENGLAND': 'GB',
  'SCOTLAND': 'GB',
  'WALES': 'GB',
  'NORTHERN IRELAND': 'GB',
  'GB': 'GB',
  'CANADA': 'CA',
  'CA': 'CA',
  'MEXICO': 'MX',
  'MX': 'MX',
  'JAPAN': 'JP',
  'JP': 'JP',
  'SPAIN': 'ES',
  'ES': 'ES',
  'FRANCE': 'FR',
  'FR': 'FR',
  'GERMANY': 'DE',
  'DE': 'DE',
  'ITALY': 'IT',
  'IT': 'IT',
  'SOUTH AFRICA': 'ZA',
  'ZA': 'ZA',
  'SOUTH KOREA': 'KR',
  'KOREA': 'KR',
  'KR': 'KR',
  'IRELAND': 'IE',
  'IE': 'IE',
  'SWEDEN': 'SE',
  'SE': 'SE',
  'NORWAY': 'NO',
  'NO': 'NO',
  'DENMARK': 'DK',
  'DK': 'DK',
  'NETHERLANDS': 'NL',
  'NL': 'NL',
  'BELGIUM': 'BE',
  'BE': 'BE',
  'SWITZERLAND': 'CH',
  'CH': 'CH',
  'AUSTRIA': 'AT',
  'AT': 'AT',
  'PORTUGAL': 'PT',
  'PT': 'PT',
  'GREECE': 'GR',
  'GR': 'GR',
  'CZECH REPUBLIC': 'CZ',
  'CZECHIA': 'CZ',
  'CZ': 'CZ',
  'POLAND': 'PL',
  'PL': 'PL',
  'HUNGARY': 'HU',
  'HU': 'HU',
  'ROMANIA': 'RO',
  'RO': 'RO',
  'THAILAND': 'TH',
  'TH': 'TH',
  'SINGAPORE': 'SG',
  'SG': 'SG',
  'CHINA': 'CN',
  'CN': 'CN',
  'INDIA': 'IN',
  'IN': 'IN',
  'BRAZIL': 'BR',
  'BR': 'BR',
  'ARGENTINA': 'AR',
  'AR': 'AR',
  'CHILE': 'CL',
  'CL': 'CL',
  'NEW ZEALAND': 'NZ',
  'NZ': 'NZ',
  'HONG KONG': 'HK',
  'HK': 'HK',
  'TAIWAN': 'TW',
  'TW': 'TW',
  'MALAYSIA': 'MY',
  'MY': 'MY',
  'INDONESIA': 'ID',
  'ID': 'ID',
  'PHILIPPINES': 'PH',
  'PH': 'PH',
  'VIETNAM': 'VN',
  'VN': 'VN',
  'TURKEY': 'TR',
  'TR': 'TR',
  'SAUDI ARABIA': 'SA',
  'SA': 'SA',
  'UNITED ARAB EMIRATES': 'AE',
  'UAE': 'AE',
  'AE': 'AE',
  'ISRAEL': 'IL',
  'IL': 'IL',
  'EGYPT': 'EG',
  'EG': 'EG',
  'SOUTH SUDAN': 'SS',
  'SS': 'SS',
  'KENYA': 'KE',
  'KE': 'KE',
}

/**
 * Normalize various country formats to ISO 3166-1 Alpha-2 code.
 *
 * Handles:
 * - ISO 2-letter codes (US, GB, AU)
 * - Full country names (United States, Great Britain)
 * - Regional variants (England -> GB, Scotland -> GB)
 * - Case variations (usa, USA, Us)
 *
 * @param value - Country code or name to normalize
 * @returns ISO 3166-1 Alpha-2 code, or null if unmappable
 *
 * @example
 * normalizeCountryCode("USA") // "US"
 * normalizeCountryCode("US") // "US"
 * normalizeCountryCode("Great Britain") // "GB"
 * normalizeCountryCode("England") // "GB"
 * normalizeCountryCode("XX") // null (invalid)
 * normalizeCountryCode(null) // null
 */
export function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toUpperCase()

  // If already a valid 2-letter code, return it
  if (normalized.length === 2 && /^[A-Z]{2}$/.test(normalized)) {
    return normalized
  }

  // Look up in mapping table
  const mapped = countryNameToCodeMap[normalized]
  return mapped ?? null
}
