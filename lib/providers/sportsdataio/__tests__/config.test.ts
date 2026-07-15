import { describe, expect, it } from "vitest"

import { AuthenticationError, ProviderError } from "../../shared/errors"
import {
  SPORTSDATAIO_DEFAULT_BASE_URL,
  SPORTSDATAIO_DEFAULT_MAX_RETRIES,
  SPORTSDATAIO_DEFAULT_TIMEOUT_MS,
  validateSportsDataIoConfig,
} from "../config"

describe("validateSportsDataIoConfig", () => {
  it("returns a fully-defaulted config from just an api key", () => {
    const config = validateSportsDataIoConfig({ apiKey: "test-key" })
    expect(config).toEqual({
      apiKey: "test-key",
      baseUrl: SPORTSDATAIO_DEFAULT_BASE_URL,
      timeoutMs: SPORTSDATAIO_DEFAULT_TIMEOUT_MS,
      maxRetries: SPORTSDATAIO_DEFAULT_MAX_RETRIES,
    })
  })

  it("trims the api key and strips trailing slashes from the base url", () => {
    const config = validateSportsDataIoConfig({
      apiKey: "  spaced-key  ",
      baseUrl: "https://example.test/golf/v2/",
    })
    expect(config.apiKey).toBe("spaced-key")
    expect(config.baseUrl).toBe("https://example.test/golf/v2")
  })

  it("throws AuthenticationError when the api key is missing", () => {
    expect(() => validateSportsDataIoConfig({})).toThrow(AuthenticationError)
  })

  it("throws AuthenticationError when the api key is blank", () => {
    expect(() => validateSportsDataIoConfig({ apiKey: "   " })).toThrow(AuthenticationError)
  })

  it("rejects a non-http base url", () => {
    expect(() =>
      validateSportsDataIoConfig({ apiKey: "k", baseUrl: "ftp://nope" }),
    ).toThrow(ProviderError)
  })

  it("rejects a non-positive timeout", () => {
    expect(() =>
      validateSportsDataIoConfig({ apiKey: "k", timeoutMs: 0 }),
    ).toThrow(ProviderError)
  })

  it("rejects a negative retry count", () => {
    expect(() =>
      validateSportsDataIoConfig({ apiKey: "k", maxRetries: -1 }),
    ).toThrow(ProviderError)
  })
})
