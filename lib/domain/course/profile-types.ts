/**
 * Course Intelligence — normalized profile types.
 *
 * The Course Intelligence Engine turns the raw, verified course facts CaddieIQ
 * stores (`Course` core columns + the `CourseCharacteristic` analytics record)
 * into a single, consistently-shaped {@link CourseProfile} that future models
 * (Course Fit, DFS Value, Betting, Wind, AI Coach) can consume directly.
 *
 * Design rules (see docs/COURSE_INTELLIGENCE.md):
 * - **One consistent representation.** Every characteristic is a
 *   {@link CourseSignal}: either `verified` (carrying a value derived only from
 *   real source data) or `unknown`. Every *rated* characteristic is normalized
 *   onto the same qualitative band — `low | medium | high`.
 * - **Unknown stays unknown.** A missing or non-finite source value yields an
 *   `unknown` signal. The engine never invents, defaults, or interpolates a
 *   value to fill a gap.
 * - **Pure + serializable.** These types import nothing from Prisma or a
 *   provider, so the builder is a pure function that is trivially testable and
 *   safe to send from a Server Component to the client.
 */

/** The single qualitative scale every *rated* characteristic normalizes onto. */
export type CourseBand = "low" | "medium" | "high"

/** How a characteristic is expressed once verified. */
export type CourseSignalKind = "category" | "measure" | "rating"

/**
 * A single verified-or-unknown reading for one characteristic. Discriminated on
 * `status` first (so "unknown" is impossible to confuse with a real value) and
 * then on `kind`. Every verified variant carries a pre-formatted `display`
 * string built purely from the source value — never a fabricated stand-in.
 */
export type CourseSignal =
  | { readonly status: "unknown" }
  | {
      readonly status: "verified"
      readonly kind: "category"
      /** Canonical token, e.g. "LINKS" or a derived key like "birdie-fest". */
      readonly value: string
      /** Human label, e.g. "Links". */
      readonly display: string
    }
  | {
      readonly status: "verified"
      readonly kind: "measure"
      /** The raw verified magnitude (e.g. 7,435). */
      readonly value: number
      /** Formatted with unit, e.g. "7,435 yds". */
      readonly display: string
    }
  | {
      readonly status: "verified"
      readonly kind: "rating"
      /** Normalized qualitative band. */
      readonly band: CourseBand
      /** The verified source magnitude the band was derived from. */
      readonly raw: number
      /** Band label, e.g. "High". */
      readonly display: string
    }

/** Logical grouping used to lay the profile out on the page. */
export type CourseProfileGroup = "identity" | "surfaces" | "setup" | "demands" | "scoring"

/** Stable key for every characteristic the engine models. */
export type CourseCharacteristicKey =
  | "courseType"
  | "par"
  | "length"
  | "elevation"
  | "fairwayGrass"
  | "roughGrass"
  | "greenSurface"
  | "greenSpeed"
  | "fairwayWidth"
  | "roughSeverity"
  | "treeCoverage"
  | "waterDifficulty"
  | "windExposure"
  | "elevationChange"
  | "drivingImportance"
  | "approachImportance"
  | "shortGameImportance"
  | "puttingImportance"
  | "aroundGreenDifficulty"
  | "scoringEnvironment"
  | "scoringVariance"

/**
 * Static description of a characteristic: what it is, how it is grouped, and —
 * for ratings — what a "high" band means. This metadata is what makes the
 * profile self-describing for both the UI and downstream models.
 */
export interface CourseCharacteristicMeta {
  readonly key: CourseCharacteristicKey
  readonly label: string
  readonly kind: CourseSignalKind
  readonly group: CourseProfileGroup
  /** Unit suffix for `measure` characteristics (e.g. "yds", "ft"). */
  readonly unit?: string
  /** For ratings: the direction of the scale, e.g. "Higher = more exposed". */
  readonly interpretation?: string
  /** One-line explanation surfaced as helper text and in docs. */
  readonly description: string
}

/** A characteristic's static metadata paired with its verified-or-unknown reading. */
export interface CourseCharacteristic {
  readonly meta: CourseCharacteristicMeta
  readonly signal: CourseSignal
}

/** Honest coverage accounting so the UI can show how complete the profile is. */
export interface CourseProfileCoverage {
  /** Characteristics with a verified reading. */
  readonly verified: number
  /** Total characteristics the engine models. */
  readonly total: number
}

/**
 * The normalized Course Intelligence profile for one course — the single object
 * future models consume. Every modeled characteristic is present in
 * `characteristics` (in display order); unresolved ones are `unknown` rather
 * than omitted, so the shape is stable regardless of how much data exists.
 */
export interface CourseProfile {
  readonly courseId: string
  readonly characteristics: readonly CourseCharacteristic[]
  readonly coverage: CourseProfileCoverage
}

// ---------------------------------------------------------------------------
// Builder input (persistence-agnostic mirror of the verified source columns)
// ---------------------------------------------------------------------------

/** Course style tokens (mirrors the `CourseStyle` enum without importing it). */
export type CourseStyleValue =
  | "LINKS"
  | "PARKLAND"
  | "DESERT"
  | "HEATHLAND"
  | "MOUNTAIN"
  | "OTHER"

/** Grass tokens (mirrors the `GrassType` enum without importing it). */
export type GrassTypeValue =
  | "BENT"
  | "BERMUDA"
  | "POA"
  | "RYE"
  | "ZOYSIA"
  | "FESCUE"
  | "OTHER"

/** The verified `CourseCharacteristic` analytics record, or its absence. */
export interface CourseCharacteristicInput {
  readonly style: CourseStyleValue | null
  readonly fairwayGrass: GrassTypeValue | null
  readonly roughGrass: GrassTypeValue | null
  readonly greenGrass: GrassTypeValue | null
  readonly greenSpeed: number | null
  readonly fairwayWidth: number | null
  readonly roughLength: number | null
  readonly treeLined: boolean | null
  readonly waterHazards: number | null
  readonly windExposure: number | null
  readonly elevationChange: number | null
  readonly drivingImportance: number | null
  readonly approachImportance: number | null
  readonly shortGameImportance: number | null
  readonly puttingImportance: number | null
  readonly scramblingDifficulty: number | null
  readonly birdieRate: number | null
  readonly bogeyRate: number | null
  readonly varianceRating: number | null
}

/**
 * Everything the builder needs to derive a {@link CourseProfile}: the verified
 * `Course` core facts plus the optional `CourseCharacteristic` record. All
 * fields are nullable — the builder treats every gap as `unknown`.
 */
export interface CourseProfileInput {
  readonly courseId: string
  readonly par: number | null
  readonly yardage: number | null
  readonly altitudeFt: number | null
  readonly characteristic: CourseCharacteristicInput | null
}
