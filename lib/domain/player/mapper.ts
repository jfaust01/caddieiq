/**
 * SportsDataIO → CaddieIQ player mapper.
 *
 * This function is the **isolation boundary** for player data: it is the only
 * place in the domain layer allowed to reference a SportsDataIO wire type, and
 * it does so through an `import type` so no provider runtime code leaks across
 * the seam. Everything it returns is a provider-agnostic `Player`.
 *
 * Responsibility: **field translation only.** It does not validate (no "is this
 * a plausible player?" checks), does not persist, and does not resolve
 * relationships. Those are separate layers that consume this output.
 */

import type { SdioPlayer } from "@/lib/providers/sportsdataio/types"
import { cleanNumber, cleanString, parseDate, slugify } from "../shared/utils"
import {
  DEFAULT_HANDEDNESS,
  DEFAULT_PLAYER_STATUS,
  UNKNOWN_PLAYER_NAME,
} from "./constants"
import type { Player } from "./types"

/**
 * Translate a raw SportsDataIO player into a CaddieIQ {@link Player}.
 *
 * @param raw - The provider's un-normalized player record.
 * @returns A provider-agnostic `Player` domain object.
 */
export function mapSportsDataPlayer(raw: SdioPlayer): Player {
  const firstName = cleanString(raw.FirstName) ?? ""
  const lastName = cleanString(raw.LastName) ?? ""

  // Prefer explicit name parts; fall back to the provider's display name, then
  // to a placeholder so the domain object always has a non-empty display name.
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    cleanString(raw.DraftKingsName) ||
    UNKNOWN_PLAYER_NAME

  return {
    firstName,
    lastName,
    fullName,
    slug: slugify(fullName),
    birthDate: parseDate(raw.BirthDate as string | undefined),
    heightCm: cleanNumber(raw.HeightCm),
    weightKg: cleanNumber(raw.WeightKg),
    turnedProYear: cleanNumber(raw.TurnedPro),
    handedness: DEFAULT_HANDEDNESS,
    status: DEFAULT_PLAYER_STATUS,
    headshotUrl: cleanString(raw.PhotoUrl),
    // Raw source label/code; ISO-3166 normalization + Nationality resolution is
    // TODO(repository): map `countryCode` → a `Nationality` record on persist.
    countryCode: cleanString(raw.Country),
    externalRef: {
      source: "sportsdataio",
      externalId: String(raw.PlayerID),
    },
  }
}
