/**
 * GolfCourseAPI provider module.
 *
 * Exports the client and helper functions for course data retrieval.
 */

export { GolfCourseAPIClient, type GolfCourseDetail, type GolfCourseSearchResult } from "./client"

export function createGolfCourseAPIClient(apiKey?: string) {
  return new (require("./client").GolfCourseAPIClient)(apiKey)
}
