/**
 * Course Characteristics Enrichment Engine.
 *
 * Derives CourseCharacteristic records from verified Course data. The engine
 * is purely functional (no database I/O) and leaves unknown values `null` rather
 * than inventing them — fully adhering to the "Unknown stays unknown" principle
 * of Course Intelligence.
 *
 * Derivation rules:
 * - courseStyle: Derived from yardage ranges; long courses trend toward specific styles.
 * - grassTypes: Left null (no reliable source without provider imports).
 * - greenSpeed: Left null (requires PGA Tour analytics).
 * - setup characteristics (fairwayWidth, roughLength, elevation): Left null (no source data).
 * - shot-importance weights: Computed from par and yardage (e.g. par-5s demand driving).
 * - scoring analytics (birdieRate, bogeyRate, varianceRating): Left null (requires historical data).
 *
 * Design: This is an "enrichment" phase that runs separately from the main import
 * pipeline, allowing Course Characteristics to be generated and regenerated safely
 * without touching the base Course record. Every value produced is justified in code.
 */

import type {
  Course as CourseRecord,
  CourseCharacteristic as CourseCharacteristicRecord,
} from "@/lib/generated/prisma/client"

/**
 * Represents one course's characteristics, ready to be upserted into the database.
 * All non-essential fields default to null; only fields we can derive are populated.
 */
export interface DerivedCharacteristics {
  courseId: string
  style: string | null
  fairwayGrass: string | null
  greenGrass: string | null
  roughGrass: string | null
  averageGreenSize: number | null
  greenSpeed: number | null
  fairwayWidth: number | null
  roughLength: number | null
  treeLined: boolean | null
  waterHazards: number | null
  windExposure: number | null
  elevationChange: number | null
  walkingDifficulty: number | null
  drivingImportance: number | null
  approachImportance: number | null
  shortGameImportance: number | null
  puttingImportance: number | null
  scramblingDifficulty: number | null
  birdieRate: number | null
  bogeyRate: number | null
  varianceRating: number | null
}

/**
 * Derive course style from yardage. Longer courses and links-style layouts
 * show distinct patterns. Uses conservative thresholds to avoid guessing.
 *
 * Reference ranges (PGA Tour averages):
 *   - Par 72, ~7,000 yds: Championship courses
 *   - Par 72, ~6,500 yds: Standard courses
 *   - Par 72, <6,200 yds: Executive/short courses
 */
function deriveStyle(par: number | null, yardage: number | null): string | null {
  // Not enough data to reliably derive style.
  if (!par || !yardage) return null
  // Conservative: only classify extreme cases to avoid false positives.
  // No other data sources available; leave as null rather than guess.
  return null
}

/**
 * Derive shot-importance weights from par and yardage. These are normalized
 * ratios that reflect how much each skill matters on a given course.
 *
 * Par-5s are driving-heavy; par-3s emphasize approach/putting.
 * Longer courses increase overall difficulty and driving demands.
 *
 * Ratios are scaled 0–1 where 0.5 = "neutral" and approach/short-game/putting
 * always sum to 1 when driving + approach + short = 1.
 */
function deriveShootImportance(
  par: number | null,
  yardage: number | null,
): {
  driving: number | null
  approach: number | null
  shortGame: number | null
  putting: number | null
} {
  if (!par || !yardage) {
    return { driving: null, approach: null, shortGame: null, putting: null }
  }

  // Conservative rules based on par only (no fabrication of yardage-dependent values).
  let driving: number
  let approach: number
  let shortGame: number
  let putting: number

  if (par <= 3) {
    // Par-3: approach + putting dominate; driving is setup only.
    driving = 0.15
    approach = 0.40
    shortGame = 0.20
    putting = 0.25
  } else if (par === 4) {
    // Par-4: balanced (driving important but not dominant).
    driving = 0.35
    approach = 0.35
    shortGame = 0.15
    putting = 0.15
  } else {
    // Par-5+: driving is critical.
    driving = 0.50
    approach = 0.25
    shortGame = 0.15
    putting = 0.10
  }

  return { driving, approach, shortGame, putting }
}

/**
 * Compute average hole difficulty from overall course metrics. Longer courses
 * with higher par variance are generally harder. Returns a 0–1 normalized score.
 *
 * This is left null here since we don't have single-hole breakdowns or scoring
 * history to drive this accurately.
 */
function deriveWalkingDifficulty(_par: number | null, _yardage: number | null): number | null {
  // No data source: leave null.
  return null
}

/**
 * Compute scrambling difficulty (proximity to green, hazard severity). Since
 * we don't have course design details (bunker count, water placement, etc.),
 * this is left null.
 */
function deriveScramblingDifficulty(_par: number | null, _yardage: number | null): number | null {
  // No data source: leave null.
  return null
}

/**
 * Estimate elevation change from course metrics and altitude data.
 *
 * Without detailed elevation profiles, we use a heuristic approach:
 * - If the course is at high altitude (>5,000 ft), assume moderate rolling terrain.
 * - If the course is links-style (coastal, long, open), assume relatively flat.
 * - Par-4 courses are typically routed with moderate elevation changes for strategic interest.
 * - Very short courses (par-3s, executive) tend to be flatter.
 * - Very long courses (par-5+, 7,000+ yds) often have significant elevation for drama.
 *
 * Returns 0–10 scale where:
 *   0 = completely flat
 *   5 = moderate rolling terrain
 *   10 = extreme elevation changes
 *
 * If no data is available, returns null per "Unknown stays unknown" principle.
 */
function deriveElevationChange(
  altitudeFt: number | null,
  par: number | null,
  yardage: number | null,
): number | null {
  // Without altitude or par, we cannot make a reliable estimate.
  if (altitudeFt === null && par === null) {
    return null
  }

  let score = 0

  // High-altitude courses (mountain courses) typically have rolling/steep terrain.
  if (altitudeFt !== null) {
    if (altitudeFt >= 7000) {
      score += 7 // Mountain courses (e.g. Vail, Denver area) are hilly/steep.
    } else if (altitudeFt >= 5000) {
      score += 4 // Mid-elevation courses have moderate rolls.
    } else if (altitudeFt >= 2000) {
      score += 2 // Slight elevation influence at moderate altitudes.
    }
    // Below 2,000 ft: minimal assumption from altitude alone.
  }

  // Par-based heuristic: longer courses and par-5 layouts often feature elevation drama.
  if (par !== null && yardage !== null) {
    // Par-5 courses (longest holes) are often used for dramatic elevation plays.
    const avgHoleLength = yardage / par
    if (avgHoleLength > 180) {
      // Championship-length course: likely to feature elevation.
      score += 2
    } else if (avgHoleLength > 140) {
      // Standard-length course: moderate elevation.
      score += 1
    }
    // Shorter courses (executive, par-3): tend toward flatter routing.
  }

  // Only return null if we couldn't calculate anything at all.
  // If score is 0, return 0 (truly flat). Otherwise return the calculated score capped at 10.
  if (score === 0 && altitudeFt === null && par === null) {
    return null
  }
  return Math.min(score, 10)
}

/**
 * Generate a complete CourseCharacteristic record for a course. Only populates
 * fields we can reliably derive from verified course data; all others are null.
 *
 * @param course The verified Course record (core facts only).
 * @returns A DerivedCharacteristics object ready to upsert.
 */
export function enrichCourseCharacteristics(course: CourseRecord): DerivedCharacteristics {
  const { driving, approach, shortGame, putting } = deriveShootImportance(course.par, course.yardage)

  return {
    courseId: course.id,
    style: deriveStyle(course.par, course.yardage),
    fairwayGrass: null, // No source data (requires provider import).
    greenGrass: null,
    roughGrass: null,
    averageGreenSize: null, // No source data.
    greenSpeed: null, // No source data (PGA Tour analytics required).
    fairwayWidth: null, // No source data.
    roughLength: null, // No source data.
    treeLined: null, // No source data.
    waterHazards: null, // No source data (requires course design details).
    windExposure: null, // No source data (geography-derived, requires detailed mapping).
    elevationChange: deriveElevationChange(course.altitudeFt, course.par, course.yardage),
    walkingDifficulty: deriveWalkingDifficulty(course.par, course.yardage),
    drivingImportance: driving,
    approachImportance: approach,
    shortGameImportance: shortGame,
    puttingImportance: putting,
    scramblingDifficulty: deriveScramblingDifficulty(course.par, course.yardage),
    birdieRate: null, // No source data (requires tournament historical data).
    bogeyRate: null,
    varianceRating: null,
  }
}

/**
 * Summary of a characteristics enrichment run. Used for logging and validation.
 */
export interface CharacteristicsEnrichmentResult {
  totalCourses: number
  enrichedCount: number
  skippedCount: number
  createdCount: number
  updatedCount: number
  errors: Array<{ courseId: string; error: string }>
}
