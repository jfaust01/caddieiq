/**
 * Public API for course metric explanations.
 */

export type { RawExplanation, CourseMetricExplanationRecord, ExplanationGenerationInput, DisplayExplanation } from './types'

export {
  generateAndPersistExplanations,
  getPersistedExplanations,
  getDisplayExplanations,
  refreshCourseExplanations,
} from './service'

export {
  generateAllExplanations,
  generateExplanationForMetric,
  getExplainableMetrics,
  prepareExplanationsForStorage,
  validateExplanations,
} from './explanation-engine'

export { formatFactorsForStorage, parseFactorsFromStorage, getAllExplainableMetrics, getMetricLabel } from './utils'
