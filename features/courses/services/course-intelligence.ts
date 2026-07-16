/**
 * Persistence → domain bridge for the Course Intelligence Engine.
 *
 * Pure translation only: it maps the verified database records
 * ({@link CourseProfileInputsRow}) into the domain builder's input shape and
 * derives the normalized {@link CourseProfile}. No fetching, no I/O — safe to
 * import from both the pure course mapper and the server-only course service.
 *
 * Prisma's generated enums (`CourseStyle`, `GrassType`) are string unions that
 * line up 1:1 with the domain's `CourseStyleValue` / `GrassTypeValue`, so the
 * mapping is a direct, lossless field copy. Nothing is defaulted: every gap in
 * the source stays `null` and the engine renders it as unknown.
 */

import {
  buildCourseProfile,
  type CourseProfile,
  type CourseProfileInput,
} from '@/lib/domain/course'
import type { CourseProfileInputsRow } from '@/lib/repositories/course-repository'

/** Map the verified DB records into the engine's persistence-agnostic input. */
export function toCourseProfileInput(row: CourseProfileInputsRow): CourseProfileInput {
  const { course, characteristic } = row
  return {
    courseId: course.id,
    par: course.par,
    yardage: course.yardage,
    altitudeFt: course.altitudeFt,
    characteristic: characteristic
      ? {
          style: characteristic.style,
          fairwayGrass: characteristic.fairwayGrass,
          roughGrass: characteristic.roughGrass,
          greenGrass: characteristic.greenGrass,
          greenSpeed: characteristic.greenSpeed,
          fairwayWidth: characteristic.fairwayWidth,
          roughLength: characteristic.roughLength,
          treeLined: characteristic.treeLined,
          waterHazards: characteristic.waterHazards,
          windExposure: characteristic.windExposure,
          elevationChange: characteristic.elevationChange,
          drivingImportance: characteristic.drivingImportance,
          approachImportance: characteristic.approachImportance,
          shortGameImportance: characteristic.shortGameImportance,
          puttingImportance: characteristic.puttingImportance,
          scramblingDifficulty: characteristic.scramblingDifficulty,
          birdieRate: characteristic.birdieRate,
          bogeyRate: characteristic.bogeyRate,
          varianceRating: characteristic.varianceRating,
        }
      : null,
  }
}

/** Derive the normalized Course Intelligence profile straight from DB records. */
export function buildProfileFromRow(row: CourseProfileInputsRow): CourseProfile {
  return buildCourseProfile(toCourseProfileInput(row))
}
