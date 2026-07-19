import { NextResponse } from "next/server"

/**
 * Debug endpoint to test GolfCourseAPI connection.
 * 
 * This endpoint makes a single test request to the GolfCourseAPI
 * and returns detailed information about the request/response for debugging purposes.
 * 
 * GET /api/admin/debug/golfcourseapi
 * 
 * Returns:
 * - Request URL (API key masked)
 * - HTTP Status
 * - Response headers (including rate limit info)
 * - Response body
 * - Time taken
 * 
 * WARNING: This endpoint is for debugging only and should be removed after use.
 */

export async function GET(): Promise<NextResponse> {
  const startTime = Date.now()
  
  const apiKey = process.env.GOLFCOURSE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOLFCOURSE_API_KEY not set in environment" },
      { status: 500 }
    )
  }

  // Construct the request
  const query = "Augusta National"
  const searchUrl = new URL("https://api.golfcourseapi.com/v1/courses/search")
  searchUrl.searchParams.set("q", query)

  const requestUrl = searchUrl.toString()
  const maskedUrl = requestUrl.replace(apiKey, "***REDACTED***")

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  let status: number | null = null
  let responseHeaders: Record<string, string> = {}
  let responseBody: any = null
  let errorMessage: string | null = null

  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      headers,
    })

    status = response.status
    
    // Capture all response headers
    const headerObj: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headerObj[key] = value
    })
    responseHeaders = headerObj

    // Try to parse as JSON, fallback to text
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      try {
        responseBody = await response.json()
      } catch {
        responseBody = await response.text()
      }
    } else {
      responseBody = await response.text()
    }

    // If not ok, this is an error response but we still want to return it
    if (!response.ok) {
      errorMessage = `HTTP ${status}: ${response.statusText}`
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error)
  }

  const timeTaken = Date.now() - startTime

  return NextResponse.json({
    success: status !== null && status >= 200 && status < 300,
    requestUrl: maskedUrl,
    query: "Augusta National",
    httpStatus: status,
    responseHeaders: {
      all: responseHeaders,
      rateLimiting: {
        "retry-after": responseHeaders["retry-after"] || null,
        "x-ratelimit-limit": responseHeaders["x-ratelimit-limit"] || null,
        "x-ratelimit-remaining": responseHeaders["x-ratelimit-remaining"] || null,
        "x-ratelimit-reset": responseHeaders["x-ratelimit-reset"] || null,
      },
    },
    responseBody,
    errorMessage,
    timeTakenMs: timeTaken,
    timestamp: new Date().toISOString(),
  })
}
