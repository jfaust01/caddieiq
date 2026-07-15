import "server-only"

import type { PlayerAnalytics } from "@/lib/analytics/types"
import type { PlayerSkillProfile } from "@/lib/analytics/course-fit"

/**
 * Build the player-side skill profile the Course Fit Model consumes.
 *
 * This is the single seam between the platform's verified player data and the
 * Course Fit Model. The model matches five skill families (driving, approach,
 * short game, putting, scrambling) against a course's demands, but a skill is
 * only scored when the rating is genuinely known.
 *
 * IMPORTANT — honesty: the platform deliberately does NOT ingest per-skill
 * (strokes-gained-style) player data — see the note in `lib/analytics/types.ts`
 * ("per-skill breakdowns … are deliberately NOT part of this contract"). There
 * is therefore no verified basis to fill any family today, so every rating is
 * `null` and the model degrades to an honest "not enough data" state rather
 * than inventing skill numbers from ranking points.
 *
 * When a real per-skill feed is added, populate the families here from that
 * verified source (0–100 scale) and every downstream surface — the player card,
 * the tournament boards — lights up automatically with no further changes.
 */
export function buildPlayerSkillProfile(_analytics: PlayerAnalytics): PlayerSkillProfile {
  return {
    driving: null,
    approach: null,
    shortGame: null,
    putting: null,
    scrambling: null,
  }
}
