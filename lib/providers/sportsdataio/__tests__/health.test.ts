import { describe, expect, it } from "vitest"

import type { ProviderLogSink } from "../../shared/logger"
import { SportsDataProvider } from "../client"
import { validateSportsDataIoConfig } from "../config"
import { createSportsDataIoLogger } from "../logger"

/** A log sink that discards entries so tests stay quiet. */
const silentSink: ProviderLogSink = { write() {} }

/** Build a minimal Response-like object for a fake fetch. */
function makeResponse(init: {
  ok: boolean
  status: number
  body?: unknown
  headers?: Record<string, string>
}): Response {
  const headers = new Map(
    Object.entries(init.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
  )
  return {
    ok: init.ok,
    status: init.status,
    headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
    json: async () => init.body ?? null,
    text: async () => (init.body ? JSON.stringify(init.body) : ""),
  } as unknown as Response
}

/** Construct a provider whose fetch is fully controlled by the test. */
function makeProvider(fetchImpl: typeof fetch) {
  const config = validateSportsDataIoConfig({ apiKey: "test-key", maxRetries: 0 })
  return new SportsDataProvider(config, {
    fetch: fetchImpl,
    logger: createSportsDataIoLogger(silentSink),
    sleep: async () => {},
  })
}

describe("SportsDataProvider.health", () => {
  it("reports operational when the probe succeeds", async () => {
    const provider = makeProvider(async () =>
      makeResponse({ ok: true, status: 200, body: [] }),
    )

    const health = await provider.health()

    expect(health.providerName).toBe("sportsdataio")
    expect(health.version).toBeTypeOf("string")
    expect(health.connected).toBe(true)
    expect(health.authenticated).toBe(true)
    expect(health.status).toBe("operational")
    expect(health.latency).toBeGreaterThanOrEqual(0)
    expect(health.checkedAt).toBeInstanceOf(Date)
  })

  it("reports unauthenticated on a 401 without throwing", async () => {
    const provider = makeProvider(async () =>
      makeResponse({ ok: false, status: 401 }),
    )

    const health = await provider.health()

    expect(health.connected).toBe(true)
    expect(health.authenticated).toBe(false)
    expect(health.status).toBe("unauthenticated")
  })

  it("reports unavailable when the network fails", async () => {
    const provider = makeProvider(async () => {
      throw new Error("ECONNREFUSED")
    })

    const health = await provider.health()

    expect(health.connected).toBe(false)
    expect(health.authenticated).toBe(false)
    expect(health.status).toBe("unavailable")
  })

  it("sends the api key as a header, never in the url", async () => {
    let seenUrl = ""
    let seenKeyHeader: string | null = null

    const provider = makeProvider((async (url: string, init?: RequestInit) => {
      seenUrl = String(url)
      const headers = new Headers(init?.headers)
      seenKeyHeader = headers.get("Ocp-Apim-Subscription-Key")
      return makeResponse({ ok: true, status: 200, body: [] })
    }) as unknown as typeof fetch)

    await provider.health()

    expect(seenKeyHeader).toBe("test-key")
    expect(seenUrl).not.toContain("test-key")
  })
})
