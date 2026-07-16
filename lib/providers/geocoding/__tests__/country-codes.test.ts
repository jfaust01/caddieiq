import { describe, expect, it } from "vitest"

import { isUsStateCode, toIso2CountryCode } from "../country-codes"

describe("toIso2CountryCode", () => {
  it("maps SportsDataIO/IOC-style 3-letter codes to ISO-2", () => {
    expect(toIso2CountryCode("USA")).toBe("US")
    expect(toIso2CountryCode("MEX")).toBe("MX")
    expect(toIso2CountryCode("CAN")).toBe("CA")
    expect(toIso2CountryCode("AUS")).toBe("AU")
    expect(toIso2CountryCode("RSA")).toBe("ZA") // IOC South Africa
    expect(toIso2CountryCode("GER")).toBe("DE") // IOC Germany, not "GE"
  })

  it("maps the UK home nations to GB (OpenWeather has no ENG/SCO/WAL)", () => {
    expect(toIso2CountryCode("ENG")).toBe("GB")
    expect(toIso2CountryCode("SCO")).toBe("GB")
    expect(toIso2CountryCode("WAL")).toBe("GB")
    expect(toIso2CountryCode("NIR")).toBe("GB")
  })

  it("passes through valid ISO-2 codes case-insensitively", () => {
    expect(toIso2CountryCode("us")).toBe("US")
    expect(toIso2CountryCode("gb")).toBe("GB")
  })

  it("returns null for null, empty, or unknown input (never guesses)", () => {
    expect(toIso2CountryCode(null)).toBeNull()
    expect(toIso2CountryCode(undefined)).toBeNull()
    expect(toIso2CountryCode("")).toBeNull()
    expect(toIso2CountryCode("   ")).toBeNull()
    expect(toIso2CountryCode("ZZZ")).toBeNull()
  })
})

describe("isUsStateCode", () => {
  it("accepts 2-letter US state codes case-insensitively", () => {
    expect(isUsStateCode("CA")).toBe(true)
    expect(isUsStateCode("ga")).toBe(true)
    expect(isUsStateCode("NY")).toBe(true)
  })

  it("rejects non-state or malformed values", () => {
    expect(isUsStateCode(null)).toBe(false)
    expect(isUsStateCode(undefined)).toBe(false)
    expect(isUsStateCode("California")).toBe(false)
    expect(isUsStateCode("ZZ")).toBe(false)
  })
})
