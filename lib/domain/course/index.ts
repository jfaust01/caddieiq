/** Course domain: types, mapping rules, and the SportsDataIO mapper. */
export type { Course } from "./types"
export { UNKNOWN_COURSE_NAME } from "./constants"
export { mapSportsDataCourse } from "./mapper"

/** Course Intelligence Engine: the normalized, model-ready course profile. */
export type {
  CourseBand,
  CourseCharacteristic,
  CourseCharacteristicInput,
  CourseCharacteristicKey,
  CourseCharacteristicMeta,
  CourseProfile,
  CourseProfileCoverage,
  CourseProfileGroup,
  CourseProfileInput,
  CourseSignal,
  CourseSignalKind,
  CourseStyleValue,
  GrassTypeValue,
} from "./profile-types"
export {
  buildCourseProfile,
  COURSE_CHARACTERISTICS,
  getCharacteristic,
  hasVerifiedIntelligence,
  pickCharacteristics,
  RATING_SCALES,
} from "./profile"
