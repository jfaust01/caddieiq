import { describe, expect, it } from "vitest"

import {
  AuthenticationError,
  NetworkError,
  ProviderError,
  RateLimitError,
  TimeoutError,
} from "../../shared/errors"
import {
  isRetryableStatus,
  mapSportsDataIoHttpError,
  mapSportsDataIoNetworkError,
} from "../errors"

describe("isRetryableStatus", () => {
  it("treats 429, 408 and 5xx as retryable", () => {
    expect(isRetryableStatus(429)).toBe(true)
    expect(isRetryableStatus(408)).toBe(true)
    expect(isRetryableStatus(503)).toBe(true)
  })

  it("treats ordinary 4xx as non-retryable", () => {
    expect(isRetryableStatus(400)).toBe(false)
    expect(isRetryableStatus(404)).toBe(false)
  })
})

describe("mapSportsDataIoHttpError", () => {
  it("maps 401 and 403 to a non-retryable AuthenticationError", () => {
    const unauthorized = mapSportsDataIoHttpError(401)
    const forbidden = mapSportsDataIoHttpError(403)
    expect(unauthorized).toBeInstanceOf(AuthenticationError)
    expect(unauthorized.retryable).toBe(false)
    expect(forbidden).toBeInstanceOf(AuthenticationError)
  })

  it("maps 429 to a retryable RateLimitError and parses Retry-After", () => {
    const error = mapSportsDataIoHttpError(429, { retryAfter: "2" })
    expect(error).toBeInstanceOf(RateLimitError)
    expect(error.retryable).toBe(true)
    expect((error as RateLimitError).retryAfterMs).toBe(2000)
  })

  it("maps 5xx to a retryable ProviderError", () => {
    const error = mapSportsDataIoHttpError(502)
    expect(error).toBeInstanceOf(ProviderError)
    expect(error.code).toBe("PROVIDER_ERROR")
    expect(error.retryable).toBe(true)
  })

  it("maps a generic 4xx to a non-retryable ProviderError", () => {
    const error = mapSportsDataIoHttpError(400)
    expect(error.retryable).toBe(false)
  })

  it("does not leak the api key into error details", () => {
    const error = mapSportsDataIoHttpError(500, {
      path: "/json/Players",
      body: "upstream failure",
    })
    expect(JSON.stringify(error.toJSON())).not.toContain("key")
  })
})

describe("mapSportsDataIoNetworkError", () => {
  it("maps an AbortError to a retryable TimeoutError", () => {
    const abort = new Error("aborted")
    abort.name = "AbortError"
    const error = mapSportsDataIoNetworkError(abort, { timeoutMs: 5000 })
    expect(error).toBeInstanceOf(TimeoutError)
    expect(error.retryable).toBe(true)
    expect((error as TimeoutError).timeoutMs).toBe(5000)
  })

  it("maps an unknown failure to a retryable NetworkError", () => {
    const error = mapSportsDataIoNetworkError(new Error("ECONNRESET"))
    expect(error).toBeInstanceOf(NetworkError)
    expect(error.retryable).toBe(true)
  })

  it("passes an existing ProviderError through unchanged", () => {
    const original = new ProviderError("already mapped", { provider: "sportsdataio" })
    expect(mapSportsDataIoNetworkError(original)).toBe(original)
  })
})
