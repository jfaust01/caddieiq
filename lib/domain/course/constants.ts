/**
 * Course domain constants.
 *
 * Defaults used when mapping a provider record into a `Course`.
 */

/** Placeholder used when the source supplies no course name. */
export const UNKNOWN_COURSE_NAME = "Unknown Course"

/**
 * TODO(enrichment): `CourseCharacteristic` (style, grass types, green speed,
 * shot-importance weights) is not available from SportsDataIO's tournament feed
 * and is populated by the course-analytics layer from other sources. The base
 * mapper below intentionally does not synthesize those fields.
 */
