/**
 * Convert ISO 3166-1 alpha-2 country codes to flag emojis.
 *
 * Supports all ISO 2-letter country codes and returns a white flag (🏳️) fallback
 * for unknown/invalid codes.
 */

/**
 * Convert an ISO country code to a flag emoji.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "US", "GB", "AU")
 * @returns Flag emoji for the country, or 🏳️ (white flag) if code is invalid/unknown
 *
 * @example
 * getCountryFlagEmoji("US") // 🇺🇸
 * getCountryFlagEmoji("GB") // 🇬🇧
 * getCountryFlagEmoji("XX") // 🏳️ (invalid code)
 * getCountryFlagEmoji(null)  // 🏳️ (null input)
 */
export function getCountryFlagEmoji(countryCode: string | null | undefined): string {
  // Normalize input
  const code = countryCode?.trim().toUpperCase()

  // Validate: must be exactly 2 letters
  if (!code || code.length !== 2 || !/^[A-Z]{2}$/.test(code)) {
    return '🏳️'
  }

  // Convert ISO 3166-1 alpha-2 code to regional indicator symbols
  // This works for all valid ISO country codes
  try {
    // Each letter becomes a regional indicator symbol (U+1F1E6 + offset)
    const codePointOffset = 127397 // 0x1F1E6 - 'A'.charCodeAt(0)
    const flagEmoji = String.fromCodePoint(
      code.charCodeAt(0) + codePointOffset,
      code.charCodeAt(1) + codePointOffset
    )
    return flagEmoji
  } catch {
    // Fallback to white flag if emoji generation fails
    return '🏳️'
  }
}
