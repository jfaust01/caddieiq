/**
 * SportsDataIO provider — scaffold only.
 *
 * Extends {@link BaseProvider} so it automatically gets logging, timing, and
 * error normalization around imports. Every upstream-specific method throws
 * `NOT_IMPLEMENTED` until this provider is wired to the real API in a future
 * sprint. No network calls and no credentials are used here.
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

const PROVIDER = "sportsdataio"

export class SportsDataIoProvider extends BaseProvider<unknown, unknown> {
  constructor(config: Omit<ProviderConfig, "name"> = {}) {
    super({ ...config, name: PROVIDER })
  }

  async connect(): Promise<void> {
    throw notImplemented(PROVIDER, "connect()")
  }

  async health(): Promise<ProviderStatus> {
    // Reports state without contacting the upstream API.
    return {
      provider: PROVIDER,
      state: "unknown",
      connected: this.connected,
      checkedAt: new Date(),
      message: "SportsDataIO provider is a scaffold; not yet implemented.",
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
