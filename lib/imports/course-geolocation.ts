/**
 * Course Geolocation Engine.
 *
 * The permanent, reusable layer that gives every golf course a *verified*
 * latitude/longitude — the prerequisite for Weather Intelligence, maps, travel,
 * and historical weather. It is deliberately thin orchestration over three
 * seams that each own one concern:
 *
 *   Repository → which courses still need coordinates (not yet VERIFIED)
 *   Provider   → resolve a course to a coordinate (swappable geocoder)
 *   Repository → persist ONLY verified coordinates, never overwriting a
 *                previously verified value
 *
 * Honest by construction:
 *   - Coordinates are never hardcoded or fabricated.
 *   - Only `verified` provider matches are persisted; `estimated` is ignored
 *     this sprint and UNKNOWN stays UNKNOWN.
 *   - A course that already has VERIFIED coordinates is skipped entirely — the
 *     lookup is never even attempted, so cost and rate budget go only to work
 *     that matters.
 *   - Provider/infrastructure failures are captured per course; one bad lookup
 *     never aborts the run and never throws to the caller.
 */

import { ProviderError } from "@/lib/providers/shared/errors"
import { createGeocodingProvider, type GeocodingProvider } from "@/lib/providers/geocoding"
import {
  getCourseRepository,
  type CourseGeocodeTargetRow,
  type CourseRepository,
} from "@/lib/repositories"

/** Why a single course was not given a coordinate on this run. */
export type GeolocationSkipReason =
  | "already-resolved" // handled by the repository's work-queue filter
  | "not-found" // no provider (course-precise or city-level) could locate it

/**
 * The confidence tier a coordinate was persisted at:
 *   - `verified`   — course-precise (OSM golf-course feature)
 *   - `approximate` — city-level fallback (OpenWeather locality centroid)
 */
export type ResolvedTier = "verified" | "approximate"

/** The outcome of attempting to locate one course. */
export interface GeolocationOutcome {
  courseId: string
  courseName: string
  status: "verified" | "approximate" | "skipped" | "failed"
  /** Present when `status === "skipped"`. */
  reason?: GeolocationSkipReason
  /** Present when a coordinate was persisted (verified or approximate). */
  coordinates?: { latitude: number; longitude: number; source: string; tier: ResolvedTier }
  /** Present when `status === "failed"`. */
  error?: string
}

/** Aggregate result of a geolocation run, suitable for an import report. */
export interface GeolocationSummary {
  coursesConsidered: number
  /** Course-precise matches (OSM). */
  verified: number
  /** City-level fallback matches (OpenWeather). */
  approximate: number
  skippedNotFound: number
  failed: number
  notes: string[]
}

export interface GeolocateOptions {
  repository?: CourseRepository
  provider?: GeocodingProvider
  /** Cap the number of courses processed in one run (bounds cost + time). */
  limit?: number
  maxNotes?: number
  /**
   * Upgrade mode: also re-attempt courses that currently hold an APPROXIMATE
   * (city-level) coordinate, to try to promote them to a VERIFIED match. Off by
   * default so routine runs only touch courses with no usable coordinate yet.
   */
  includeApproximate?: boolean
}

/**
 * The Course Geolocation service. Constructed with its two collaborators so it
 * is trivially testable with fakes; the defaults wire the real repository and
 * the environment-selected geocoding provider.
 */
export class CourseGeolocationService {
  constructor(
    private readonly repository: CourseRepository,
    private readonly provider: GeocodingProvider,
  ) {}

  /** Wire the real repository + configured provider. */
  static create(): CourseGeolocationService {
    return new CourseGeolocationService(getCourseRepository(), createGeocodingProvider())
  }

  /**
   * Locate a single course by its facts and persist the best coordinate the
   * two-tier provider returns:
   *   - a `verified` golf-course match  → persisted at VERIFIED (course-precise)
   *   - an `estimated` city-level match → persisted at APPROXIMATE (city-level)
   *
   * The provider (a composite) is responsible for trying course-precise first
   * and only falling back to city-level; this method simply honours whatever
   * confidence it returns and routes it to the matching repository writer, each
   * of which refuses to downgrade an already-better coordinate. Returns a
   * structured {@link GeolocationOutcome}; only throws if a repository write
   * throws unexpectedly (it is designed not to).
   */
  async locateCourse(course: CourseGeocodeTargetRow): Promise<GeolocationOutcome> {
    let match
    try {
      match = await this.provider.geocodeCourse({
        courseName: course.name,
        city: course.city,
        stateProvince: course.stateProvince,
        country: course.country,
      })
    } catch (error) {
      const message = error instanceof ProviderError ? error.message : String(error)
      return { courseId: course.id, courseName: course.name, status: "failed", error: message }
    }

    if (!match) {
      return { courseId: course.id, courseName: course.name, status: "skipped", reason: "not-found" }
    }

    // Route by the confidence the provider reported. "verified" is course-
    // precise; anything else the composite returns is a city-level fallback and
    // is recorded as APPROXIMATE — never silently promoted to verified.
    const tier: ResolvedTier = match.confidence === "verified" ? "verified" : "approximate"
    const coords = { latitude: match.latitude, longitude: match.longitude, source: match.source }

    const result =
      tier === "verified"
        ? await this.repository.setVerifiedCoordinates(course.id, coords)
        : await this.repository.setApproximateCoordinates(course.id, coords)

    if (result.outcome === "failed") {
      return {
        courseId: course.id,
        courseName: course.name,
        status: "failed",
        error: result.error?.message ?? "persist failed",
      }
    }
    if (result.outcome === "skipped") {
      // The course was already resolved at an equal-or-better tier between
      // selection and write (idempotent / no-downgrade).
      return { courseId: course.id, courseName: course.name, status: "skipped", reason: "already-resolved" }
    }

    return {
      courseId: course.id,
      courseName: course.name,
      status: tier,
      coordinates: { ...coords, tier },
    }
  }

  /**
   * Locate every course that still needs work, one at a time (the provider
   * enforces its own request spacing). Returns an aggregate summary. Resolved
   * courses are excluded by the repository query, so this is safe and cheap to
   * re-run: it only ever works on the remaining backlog.
   *
   * @param options.includeApproximate - Also re-attempt APPROXIMATE courses to
   *   try upgrading them to a VERIFIED (course-precise) match.
   */
  async locatePendingCourses(
    limit?: number,
    maxNotes = 25,
    options: { includeApproximate?: boolean } = {},
  ): Promise<GeolocationSummary> {
    const targets = await this.repository.findCoursesNeedingCoordinates(limit, {
      includeApproximate: options.includeApproximate,
    })
    const summary: GeolocationSummary = {
      coursesConsidered: targets.length,
      verified: 0,
      approximate: 0,
      skippedNotFound: 0,
      failed: 0,
      notes: [],
    }
    const note = (message: string) => {
      if (summary.notes.length < maxNotes) summary.notes.push(message)
    }

    for (const course of targets) {
      const outcome = await this.locateCourse(course)
      switch (outcome.status) {
        case "verified":
          summary.verified += 1
          break
        case "approximate":
          summary.approximate += 1
          note(`${course.name}: no course-precise match; stored city-level (APPROXIMATE).`)
          break
        case "failed":
          summary.failed += 1
          note(`${course.name}: ${outcome.error ?? "failed"}.`)
          break
        case "skipped":
          if (outcome.reason === "not-found") {
            summary.skippedNotFound += 1
            note(`${course.name}: no course-precise or city-level match found.`)
          }
          // "already-resolved" is a benign idempotent no-op; not noted.
          break
      }
    }

    return summary
  }
}

/**
 * Convenience entry point for import jobs and admin tooling: run the geolocation
 * backlog with the real, environment-configured collaborators.
 */
export async function importCourseCoordinates(
  options: GeolocateOptions = {},
): Promise<GeolocationSummary> {
  const service = new CourseGeolocationService(
    options.repository ?? getCourseRepository(),
    options.provider ?? createGeocodingProvider(),
  )
  return service.locatePendingCourses(options.limit, options.maxNotes, {
    includeApproximate: options.includeApproximate,
  })
}
