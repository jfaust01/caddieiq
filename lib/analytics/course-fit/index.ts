/**
 * Course Fit — public surface.
 *
 * `CourseFitModule` is the (dormant) generic analytics-registry scaffold. The
 * real, authoritative engine is the pure {@link computeCourseFit} model below,
 * which powers the Player and Tournament fit surfaces. See
 * docs/COURSE_FIT_MODEL.md.
 */
export { CourseFitModule } from "./module"

export {
  buildFieldFitBoard,
  computeCourseFit,
  emptyPlayerSkillProfile,
  fitBand,
  fitBandLabel,
} from "./model"

export type {
  CourseFitInput,
  CourseFitResult,
  FieldFitBoard,
  FieldFitEntry,
  FitBand,
  FitConfidence,
  FitCoverage,
  FitDriver,
  FitSignal,
  FitSignalStatus,
  FitSkillKey,
  FitUnavailableReason,
  PlayerSkillProfile,
} from "./types"
export { FIT_SKILL_KEYS } from "./types"
