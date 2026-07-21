/**
 * GolfCourseAPI authenticated client.
 *
 * Handles requests to the GolfCourse API with authentication, retry logic,
 * rate limit handling, and centralized error handling.
 */

import { ProviderError } from "../shared/errors"
import type { ProviderErrorDetails } from "../shared/errors"

export interface GolfCourseSearchResult {
  id: number
  name: string
  country: string
  state?: string
  city?: string
}

export interface GolfCourseDetail {
  id: number
  name: string
  clubName?: string
  address?: {
    city?: string
    state?: string
    country?: string
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
  contact?: {
    website?: string
    phone?: string
  }
  specifications?: {
    par?: number
    totalYardage?: number
    courseRating?: number
    slopeRating?: number
  }
  metadata?: {
    architect?: string
    yearBuilt?: number
    courseStyle?: string
  }
  playingConditions?: {
    grassTypeFairway?: string
    grassTypeGreen?: string
    greenSize?: string
    greenSpeed?: string
    elevation?: number
  }
  facilities?: {
    drivingRange?: boolean
    puttingGreen?: boolean
    shortGameArea?: boolean
  }
  holes?: Array<{
    number: number
    par?: number
    yardage?: number
    handicap?: number
  }>
  tees?: Array<{
    name: string
    color?: string
    gender?: string
    yardage?: number
    rating?: number
    slope?: number
  }>
}

/**
 * GolfCourseAPI client with authentication and error handling.
 */
export class GolfCourseAPIClient {
  private readonly apiKey: string
  private readonly baseUrl = "https://api.golfcourseapi.com/v1"
  private readonly maxRetries = 3
  private readonly retryDelayMs = 1000

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOLFCOURSE_API_KEY || ""
    if (!this.apiKey) {
      throw new Error("GOLFCOURSE_API_KEY is not set. Add it to your environment.")
    }
  }

  /**
   * Search for courses by name, location, or other criteria.
   */
  async searchCourses(query: string): Promise<GolfCourseSearchResult[]> {
    const url = `${this.baseUrl}/search`
    const params = new URLSearchParams({ search_query: query })

    const response = await this.fetchWithRetry(`${url}?${params}`, {
      method: "GET",
      headers: this.getHeaders(),
    })

    // API returns { courses: [...] }, extract the array
    const data = response.data as { courses?: GolfCourseSearchResult[] }
    return data?.courses || []
  }

  /**
   * Get detailed information about a specific course.
   */
  async getCourseDetails(courseId: number): Promise<GolfCourseDetail | null> {
    const url = `${this.baseUrl}/courses/${courseId}`

    const response = await this.fetchWithRetry(url, {
      method: "GET",
      headers: this.getHeaders(),
    })

    // API returns { course: {...} }, extract and normalize the nested course object
    const data = response.data as { course?: any }
    const rawCourse = data?.course
    
    if (!rawCourse) {
      return null
    }

    // Normalize the raw API payload to GolfCourseDetail shape
    return this.normalizeCoursePayload(rawCourse)
  }

  /**
   * Normalize raw GolfCourseAPI payload to internal GolfCourseDetail shape.
   * 
   * Handles field name mappings and structure conversions:
   * - snake_case to camelCase
   * - Nested location to flat address/coordinates
   * - Tees object with gender keys to array
   * - Hole extraction from tee definitions
   */
  private normalizeCoursePayload(raw: any): GolfCourseDetail {
    // Extract all holes from all tee boxes (combine male and female)
    const allHoles: Array<{
      number: number
      par?: number
      yardage?: number
      handicap?: number
    }> = []

    const teesArray: GolfCourseDetail["tees"] = []

    // Process tees object which has gender keys (male, female, etc.)
    if (raw.tees && typeof raw.tees === "object") {
      Object.entries(raw.tees).forEach(([gender, teeList]: [string, any]) => {
        if (Array.isArray(teeList)) {
          teeList.forEach((tee: any) => {
            // Add to tees array
            teesArray.push({
              name: tee.tee_name || tee.name || "",
              color: tee.color,
              gender: gender,
              yardage: tee.total_yards,
              rating: tee.course_rating,
              slope: tee.slope_rating,
            })

            // Extract holes from tee (only from first tee to avoid duplicates)
            if (allHoles.length === 0 && Array.isArray(tee.holes)) {
              tee.holes.forEach((hole: any, idx: number) => {
                allHoles.push({
                  number: idx + 1,
                  par: hole.par,
                  yardage: hole.yardage,
                  handicap: hole.handicap,
                })
              })
            }
          })
        }
      })
    }

    // Build normalized course detail
    const normalized: GolfCourseDetail = {
      id: raw.id,
      name: raw.course_name || raw.name || "",
      clubName: raw.club_name || raw.clubName,
      address: raw.location
        ? {
            city: raw.location.city,
            state: raw.location.state,
            country: raw.location.country,
          }
        : undefined,
      coordinates: raw.location && (raw.location.latitude || raw.location.longitude)
        ? {
            latitude: raw.location.latitude,
            longitude: raw.location.longitude,
          }
        : undefined,
      holes: allHoles.length > 0 ? allHoles : undefined,
      tees: teesArray.length > 0 ? teesArray : undefined,
    }

    return normalized
  }

  /**
   * Alias for getCourseDetails for convenience.
   */
  async fetchCourse(courseId: number): Promise<GolfCourseDetail | null> {
    return this.getCourseDetails(courseId)
  }

  /**
   * Fetch with automatic retry logic and error handling.
   */
  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    attempt = 0,
  ): Promise<{ data: any; status: number }> {
    try {
      const response = await fetch(url, init)

      if (!response.ok) {
        const body = await response.text()
        throw this.createProviderError(response.status, response.statusText, url, body)
      }

      const data = await response.json()
      return { data, status: response.status }
    } catch (error) {
      // Retry on network errors or 5xx server errors
      if (
        error instanceof ProviderError ||
        (error instanceof TypeError && error.message.includes("fetch"))
      ) {
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelayMs * Math.pow(2, attempt))
          return this.fetchWithRetry(url, init, attempt + 1)
        }
      }
      throw error
    }
  }

  /**
   * Create a ProviderError with detailed information.
   */
  private createProviderError(
    status: number,
    statusText: string,
    url: string,
    body: string,
  ): ProviderError {
    const details: ProviderErrorDetails = {
      status,
      method: "GET",
      path: new URL(url).pathname,
      body: body.substring(0, 500), // Truncate for logging
    }

    const message = `GolfCourseAPI returned ${status} ${statusText}`
    return new ProviderError(message, "golfcourseapi", details)
  }

  /**
   * Get request headers with API key.
   */
  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }
  }

  /**
   * Delay for retry logic.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
