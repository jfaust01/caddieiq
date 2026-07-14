/**
 * OpenWeather provider — scaffold only.
 *
 * Extends {@link BaseProvider} for automatic logging, timing, and error
 * normalization. Every upstream-specific method throws `NOT_IMPLEMENTED` until
 * this provider is wired to the real API in a future sprint. No network calls
 * and no credentials are used here.
 */

import { BaseProvider } from "../shared/base-provider"
import { notImplemented } from "../shared/errors"
import type {
  ImportJob,
  ImportResult,
  ProviderConfig,
  ProviderStatus,
  ValidationResult,
} from "../shared/types"

const PROVIDER = "weather"

export class WeatherProvider extends BaseProvider<unknown, unknown> {
  constructor(config: Omit<ProviderConfig, "name"> = {}) {
    super({ ...config, name: PROVIDER })
  }

  async connect(): Promise<void> {
    throw notImplemented(PROVIDER, "connect()")
  }

  async health(): Promise<ProviderStatus> {
    return {
      provider: PROVIDER,
      state: "unknown",
      connected: this.connected,
      checkedAt: new Date(),
      message: "OpenWeather provider is a scaffold; not yet implemented.",
    }
  }

  async disconnect(): Promise<void> {
    this.markDisconnected()
  }

  normalize(): unknown {
    throw notImplemented(PROVIDER, "normalize()")
  }

  validate(): ValidationResult {
    throw notImplemented(PROVIDER, "validate()")
  }

  protected async execute(_job: ImportJob): Promise<ImportResult<unknown>> {
    throw notImplemented(PROVIDER, "import()")
  }
}
