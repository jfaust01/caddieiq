/**
 * Course Intelligence Engine — normalization + profile builder.
 *
 * `buildCourseProfile` is a pure function: given the verified `Course` core
 * facts and optional `CourseCharacteristic` record, it returns a normalized
 * {@link CourseProfile}. It performs no I/O and mutates nothing.
 *
 * The two load-bearing honesty guarantees live here:
 * 1. A source value that is `null`, `undefined`, or non-finite always produces
 *    an `unknown` signal — the engine never substitutes a default.
 * 2. Every rated characteristic is normalized onto the same `low | medium |
 *    high` band using the explicit, documented thresholds in
 *    {@link RATING_SCALES}. The canonical source scales are the ingestion
 *    contract documented in docs/COURSE_INTELLIGENCE.md.
 */

import type {
  CourseBand,
  CourseCharacteristic,
  CourseCharacteristicInput,
  CourseCharacteristicKey,
  CourseCharacteristicMeta,
  CourseProfile,
  CourseProfileInput,
  CourseSignal,
  CourseStyleValue,
  GrassTypeValue,
} from "./profile-types"

/** The unknown signal, shared so every gap is referentially identical. */
const UNKNOWN: CourseSignal = { status: "unknown" }

const BAND_LABELS: Record<CourseBand, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

const YARDAGE_FMT = new Intl.NumberFormat("en-US")

// ---------------------------------------------------------------------------
// Display maps for categorical facts
// ---------------------------------------------------------------------------

const COURSE_STYLE_LABELS: Record<CourseStyleValue, string> = {
  LINKS: "Links",
  PARKLAND: "Parkland",
  DESERT: "Desert",
  HEATHLAND: "Heathland",
  MOUNTAIN: "Mountain",
  OTHER: "Other",
}

const GRASS_LABELS: Record<GrassTypeValue, string> = {
  BENT: "Bentgrass",
  BERMUDA: "Bermuda",
  POA: "Poa annua",
  RYE: "Ryegrass",
  ZOYSIA: "Zoysia",
  FESCUE: "Fescue",
  OTHER: "Other",
}

const SCORING_ENVIRONMENT_LABELS: Record<string, string> = {
  "birdie-fest": "Birdie fest",
  neutral: "Neutral",
  "major-championship": "Major championship",
}

// ---------------------------------------------------------------------------
// Rating normalization
// ---------------------------------------------------------------------------

/**
 * A tertile threshold: values below `lowMax` band `low`, values at or above
 * `highMin` band `high`, everything between bands `medium`. Each entry documents
 * the canonical source scale the importer is expected to supply.
 */
interface RatingScale {
  readonly lowMax: number
  readonly highMin: number
}

/**
 * Canonical source scales + thresholds for every rated characteristic. These
 * are the normalization contract: importers must populate the source columns on
 * these scales. Changing a threshold is a deliberate, documented calibration.
 */
export const RATING_SCALES: Record<string, RatingScale> = {
  // Stimpmeter feet: tour greens run ~10–13; <10 slow, >=12 fast.
  greenSpeed: { lowMax: 10, highMin: 12 },
  // Fairway width in yards: <28 narrow (penal), >=38 generous. High = wider.
  fairwayWidth: { lowMax: 28, highMin: 38 },
  // Rough length in inches: <2.5 forgiving, >=4 penal.
  roughSeverity: { lowMax: 2.5, highMin: 4 },
  // Discrete water-hazard count: 0–2 low, 3–5 medium, >=6 high.
  waterDifficulty: { lowMax: 3, highMin: 6 },
  // Normalized 0–1 exposure fraction (tertiles).
  windExposure: { lowMax: 0.34, highMin: 0.67 },
  // Total vertical change across the routing, in feet.
  elevationChange: { lowMax: 30, highMin: 80 },
  // Normalized 0–1 shot-importance weights (tertiles).
  drivingImportance: { lowMax: 0.34, highMin: 0.67 },
  approachImportance: { lowMax: 0.34, highMin: 0.67 },
  shortGameImportance: { lowMax: 0.34, highMin: 0.67 },
  puttingImportance: { lowMax: 0.34, highMin: 0.67 },
  // Normalized 0–1 scrambling difficulty (tertiles).
  aroundGreenDifficulty: { lowMax: 0.34, highMin: 0.67 },
  // Normalized 0–1 scoring variance / volatility (tertiles).
  scoringVariance: { lowMax: 0.34, highMin: 0.67 },
}

/** True only for real, finite numbers — the gate every derivation passes through. */
function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

/** Classify a verified magnitude into a band using an explicit scale. */
function toBand(raw: number, scale: RatingScale): CourseBand {
  if (raw < scale.lowMax) return "low"
  if (raw >= scale.highMin) return "high"
  return "medium"
}

/** Build a rating signal from a raw source value, or `unknown` when absent. */
function rating(raw: number | null | undefined, scale: RatingScale): CourseSignal {
  if (!isFiniteNumber(raw)) return UNKNOWN
  const band = toBand(raw, scale)
  return { status: "verified", kind: "rating", band, raw, display: BAND_LABELS[band] }
}

/** Build a measure signal (number + unit), or `unknown` when absent. */
function measure(
  value: number | null | undefined,
  format: (value: number) => string,
): CourseSignal {
  if (!isFiniteNumber(value)) return UNKNOWN
  return { status: "verified", kind: "measure", value, display: format(value) }
}

/** Build a categorical signal from a token + label map, or `unknown` when absent. */
function category(
  value: string | null | undefined,
  labels: Record<string, string>,
): CourseSignal {
  if (value == null || !(value in labels)) return UNKNOWN
  return { status: "verified", kind: "category", value, display: labels[value] }
}

/**
 * Derive the scoring environment from verified birdie/bogey rates (0–1
 * fractions). Requires at least one of the two rates; returns `unknown`
 * otherwise so it is never fabricated.
 *
 * - High birdie rate with a contained bogey rate → "birdie-fest".
 * - Elevated bogey rate (penal, major-style setup) → "major-championship".
 * - Anything else with data → "neutral".
 */
function scoringEnvironment(
  birdieRate: number | null | undefined,
  bogeyRate: number | null | undefined,
): CourseSignal {
  const hasBirdie = isFiniteNumber(birdieRate)
  const hasBogey = isFiniteNumber(bogeyRate)
  if (!hasBirdie && !hasBogey) return UNKNOWN

  let token = "neutral"
  if (hasBogey && (bogeyRate as number) >= 0.22) {
    token = "major-championship"
  } else if (hasBirdie && (birdieRate as number) >= 0.2 && (!hasBogey || (bogeyRate as number) <= 0.16)) {
    token = "birdie-fest"
  }
  return {
    status: "verified",
    kind: "category",
    value: token,
    display: SCORING_ENVIRONMENT_LABELS[token],
  }
}

/**
 * Project the boolean `treeLined` flag onto the shared band scale: a faithful,
 * documented coarse mapping (false → low, true → high). `medium` is
 * unreachable from a boolean by design; the `raw` mirrors the flag (0/1).
 */
function treeCoverage(treeLined: boolean | null | undefined): CourseSignal {
  if (typeof treeLined !== "boolean") return UNKNOWN
  const band: CourseBand = treeLined ? "high" : "low"
  return { status: "verified", kind: "rating", band, raw: treeLined ? 1 : 0, display: BAND_LABELS[band] }
}

// ---------------------------------------------------------------------------
// Characteristic registry (metadata + display order)
// ---------------------------------------------------------------------------

/**
 * Every characteristic the engine models, in display order. The metadata is the
 * contract the UI and downstream models read; the builder attaches a signal to
 * each key below.
 */
export const COURSE_CHARACTERISTICS: readonly CourseCharacteristicMeta[] = [
  {
    key: "courseType",
    label: "Course type",
    kind: "category",
    group: "identity",
    description: "The architectural archetype of the venue (links, parkland, desert, …).",
  },
  {
    key: "par",
    label: "Par",
    kind: "measure",
    group: "identity",
    description: "The regulation number of strokes for the course.",
  },
  {
    key: "length",
    label: "Course length",
    kind: "measure",
    group: "identity",
    unit: "yds",
    description: "Total scorecard yardage from the championship tees.",
  },
  {
    key: "elevation",
    label: "Elevation",
    kind: "measure",
    group: "identity",
    unit: "ft",
    description: "Height above sea level, which affects carry distance.",
  },
  {
    key: "fairwayGrass",
    label: "Fairway grass",
    kind: "category",
    group: "surfaces",
    description: "Predominant grass species on the fairways.",
  },
  {
    key: "roughGrass",
    label: "Rough grass",
    kind: "category",
    group: "surfaces",
    description: "Predominant grass species in the rough.",
  },
  {
    key: "greenSurface",
    label: "Green surface",
    kind: "category",
    group: "surfaces",
    description: "Putting-surface grass (bentgrass, bermuda, poa annua, …).",
  },
  {
    key: "greenSpeed",
    label: "Green speed",
    kind: "rating",
    group: "setup",
    interpretation: "Higher = faster greens (Stimpmeter).",
    description: "How fast the greens roll, normalized from the Stimpmeter reading.",
  },
  {
    key: "fairwayWidth",
    label: "Fairway width",
    kind: "rating",
    group: "setup",
    interpretation: "Higher = wider, more forgiving fairways.",
    description: "How generous the fairways are off the tee.",
  },
  {
    key: "roughSeverity",
    label: "Rough severity",
    kind: "rating",
    group: "setup",
    interpretation: "Higher = longer, more penal rough.",
    description: "How punishing a missed fairway is.",
  },
  {
    key: "treeCoverage",
    label: "Tree coverage",
    kind: "rating",
    group: "setup",
    interpretation: "Higher = tree-lined; Lower = open.",
    description: "Whether the corridors are tree-lined or open.",
  },
  {
    key: "waterDifficulty",
    label: "Water difficulty",
    kind: "rating",
    group: "setup",
    interpretation: "Higher = more water in play.",
    description: "How much water hazards threaten scoring.",
  },
  {
    key: "windExposure",
    label: "Wind exposure",
    kind: "rating",
    group: "setup",
    interpretation: "Higher = more exposed to wind.",
    description: "Typical exposure of the routing to wind.",
  },
  {
    key: "elevationChange",
    label: "Elevation change",
    kind: "rating",
    group: "setup",
    interpretation: "Higher = hillier routing.",
    description: "Vertical movement across the routing (distinct from altitude).",
  },
  {
    key: "drivingImportance",
    label: "Driving importance",
    kind: "rating",
    group: "demands",
    interpretation: "Higher = driving matters more.",
    description: "How much the course rewards tee-to-green off the tee.",
  },
  {
    key: "approachImportance",
    label: "Approach importance",
    kind: "rating",
    group: "demands",
    interpretation: "Higher = approach play matters more.",
    description: "How much the course rewards iron/approach precision.",
  },
  {
    key: "shortGameImportance",
    label: "Around-the-green importance",
    kind: "rating",
    group: "demands",
    interpretation: "Higher = short game matters more.",
    description: "How much the course rewards chipping and pitching.",
  },
  {
    key: "puttingImportance",
    label: "Putting importance",
    kind: "rating",
    group: "demands",
    interpretation: "Higher = putting matters more.",
    description: "How much the course rewards putting.",
  },
  {
    key: "aroundGreenDifficulty",
    label: "Scrambling difficulty",
    kind: "rating",
    group: "demands",
    interpretation: "Higher = harder to get up and down.",
    description: "How difficult it is to save par from around the greens.",
  },
  {
    key: "scoringEnvironment",
    label: "Scoring environment",
    kind: "category",
    group: "scoring",
    description: "Whether the venue is a birdie-fest, neutral, or major-championship test.",
  },
  {
    key: "scoringVariance",
    label: "Scoring variance",
    kind: "rating",
    group: "scoring",
    interpretation: "Higher = more volatile scoring.",
    description: "How much scoring swings from round to round.",
  },
]

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Derive the verified-or-unknown signal for a single characteristic key from
 * the source inputs. Kept exhaustive over {@link CourseCharacteristicKey} so a
 * new key must be handled explicitly.
 */
function signalFor(
  key: CourseCharacteristicKey,
  input: CourseProfileInput,
  ch: CourseCharacteristicInput | null,
): CourseSignal {
  switch (key) {
    case "courseType":
      return category(ch?.style ?? null, COURSE_STYLE_LABELS)
    case "par":
      return measure(input.par, (v) => `Par ${v}`)
    case "length":
      return measure(input.yardage, (v) => `${YARDAGE_FMT.format(v)} yds`)
    case "elevation":
      return measure(input.altitudeFt, (v) => `${YARDAGE_FMT.format(v)} ft`)
    case "fairwayGrass":
      return category(ch?.fairwayGrass ?? null, GRASS_LABELS)
    case "roughGrass":
      return category(ch?.roughGrass ?? null, GRASS_LABELS)
    case "greenSurface":
      return category(ch?.greenGrass ?? null, GRASS_LABELS)
    case "greenSpeed":
      return rating(ch?.greenSpeed, RATING_SCALES.greenSpeed)
    case "fairwayWidth":
      return rating(ch?.fairwayWidth, RATING_SCALES.fairwayWidth)
    case "roughSeverity":
      return rating(ch?.roughLength, RATING_SCALES.roughSeverity)
    case "treeCoverage":
      return treeCoverage(ch?.treeLined)
    case "waterDifficulty":
      return rating(ch?.waterHazards, RATING_SCALES.waterDifficulty)
    case "windExposure":
      return rating(ch?.windExposure, RATING_SCALES.windExposure)
    case "elevationChange":
      return rating(ch?.elevationChange, RATING_SCALES.elevationChange)
    case "drivingImportance":
      return rating(ch?.drivingImportance, RATING_SCALES.drivingImportance)
    case "approachImportance":
      return rating(ch?.approachImportance, RATING_SCALES.approachImportance)
    case "shortGameImportance":
      return rating(ch?.shortGameImportance, RATING_SCALES.shortGameImportance)
    case "puttingImportance":
      return rating(ch?.puttingImportance, RATING_SCALES.puttingImportance)
    case "aroundGreenDifficulty":
      return rating(ch?.scramblingDifficulty, RATING_SCALES.aroundGreenDifficulty)
    case "scoringEnvironment":
      return scoringEnvironment(ch?.birdieRate, ch?.bogeyRate)
    case "scoringVariance":
      return rating(ch?.varianceRating, RATING_SCALES.scoringVariance)
    default: {
      // Exhaustiveness guard: a new key without a case is a compile error.
      const _never: never = key
      return _never
    }
  }
}

/**
 * Build the normalized Course Intelligence profile for one course. Pure: no
 * I/O, no mutation, deterministic. Every modeled characteristic is present;
 * absent source data yields an `unknown` signal rather than a fabricated value.
 */
export function buildCourseProfile(input: CourseProfileInput): CourseProfile {
  const ch = input.characteristic
  const characteristics: CourseCharacteristic[] = COURSE_CHARACTERISTICS.map((meta) => ({
    meta,
    signal: signalFor(meta.key, input, ch),
  }))
  const verified = characteristics.reduce(
    (count, c) => (c.signal.status === "verified" ? count + 1 : count),
    0,
  )
  return {
    courseId: input.courseId,
    characteristics,
    coverage: { verified, total: characteristics.length },
  }
}

// ---------------------------------------------------------------------------
// Selectors (convenience for the UI / downstream models)
// ---------------------------------------------------------------------------

/** Look up a single characteristic by key, or `undefined` when unknown to the engine. */
export function getCharacteristic(
  profile: CourseProfile,
  key: CourseCharacteristicKey,
): CourseCharacteristic | undefined {
  return profile.characteristics.find((c) => c.meta.key === key)
}

/** Pick an ordered subset of characteristics by key (missing keys skipped). */
export function pickCharacteristics(
  profile: CourseProfile,
  keys: readonly CourseCharacteristicKey[],
): CourseCharacteristic[] {
  const byKey = new Map(profile.characteristics.map((c) => [c.meta.key, c]))
  return keys.flatMap((key) => {
    const found = byKey.get(key)
    return found ? [found] : []
  })
}

/** True when at least one characteristic has been verified. */
export function hasVerifiedIntelligence(profile: CourseProfile): boolean {
  return profile.coverage.verified > 0
}
