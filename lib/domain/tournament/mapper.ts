/**
 * SportsDataIO → CaddieIQ tournament mapper.
 *
 * The isolation boundary for tournament data: the only place in the domain
 * layer allowed to reference the SportsDataIO tournament wire type, via
 * `import type`. Field translation only — no validation, no persistence, no
 * relationship resolution (tour/season/venue linkage happens on persist).
 */

import type { SdioTournament } from "@/lib/providers/sportsdataio/types"
import { cleanNumber, cleanString, parseDate, slugify } from "../shared/utils"
import {
  DEFAULT_TOURNAMENT_FORMAT,
  TOURNAMENT_STATUS_BY_IS_OVER,
  UNKNOWN_TOURNAMENT_NAME,
} from "./constants"
import type { Tournament } from "./types"

/**
 * Translate a raw SportsDataIO tournament into a CaddieIQ {@link Tournament}.
 *
 * @param raw - The provider's un-normalized tournament record.
 * @returns A provider-agnostic `Tournament` domain object.
 */
export function mapSportsDataTournament(raw: SdioTournament): Tournament {
  const name = cleanString(raw.Name) ?? UNKNOWN_TOURNAMENT_NAME

  return {
    name,
    // SportsDataIO exposes only a single display name; a distinct official name
    // is a curated/enrichment field, so it is null at map time.
    officialName: null,
    slug: slugify(name),
    status: TOURNAMENT_STATUS_BY_IS_OVER[raw.IsOver === true ? "true" : "false"],
    format: DEFAULT_TOURNAMENT_FORMAT,
    startDate: parseDate(raw.StartDate),
    endDate: parseDate(raw.EndDate),
    purse: cleanNumber(raw.Purse),
    externalRef: {
      source: "sportsdataio",
      externalId: String(raw.TournamentID),
    },
  }
}
