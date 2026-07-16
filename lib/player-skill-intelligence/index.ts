/**
 * Player Skill Intelligence — the fifth CaddieIQ Signal Family.
 *
 * A pure, deterministic engine that turns raw per-round skill samples
 * (`RoundStatistic` rows) into a normalized, percentile-ranked skill profile
 * with explicit confidence and an honest "Unknown" state. It never fabricates a
 * skill value: a player with no sampled rounds for a skill is reported as
 * `null`/Unknown, not as an invented number.
 *
 * This barrel re-exports only client-safe, pure surface (types + pure builders).
 * The server-only data access lives in `./service` and the repository layer.
 */
export * from "./types"
export {
  SKILL_DEFINITIONS,
  SKILL_BY_KEY,
  SKILL_KEYS,
  SOURCEABLE_SKILL_KEYS,
  aggregateRawSkills,
  latestPlayedAt,
} from "./catalog"
export {
  buildPlayerSkillProfile,
  unavailableSkillProfile,
  buildSkillLeaderboards,
  toCourseFitSkillProfile,
  type RankedPlayerSkill,
} from "./profile"
export {
  MIN_POPULATION,
  percentileOf,
  scoreToBand,
  bandLabel,
  bandAdjective,
  gradeSkillConfidence,
  gradeProfileConfidence,
  familyLabel,
} from "./normalize"
