/**
 * CaddieIQ data-provider framework.
 *
 * This is the architecture layer that every external data source plugs into.
 * It defines shared contracts ({@link Provider}, {@link ImportJob},
 * {@link ImportResult}, {@link Normalizer}), a {@link BaseProvider} that
 * supplies logging/timing/error handling, standardized error classes, and
 * scaffolded providers for SportsDataIO, DataGolf, OpenWeather, and the Odds
 * API. No network calls, credentials, or concrete data mapping live here yet.
 */

import { DataGolfProvider } from "./datagolf"
import { OddsProvider } from "./odds"
import type { BaseProvider } from "./shared/base-provider"
import type { ProviderConfig, ProviderName } from "./shared/types"
import { SportsDataIoProvider } from "./sportsdataio"
import { WeatherProvider } from "./weather"

export * from "./shared"
export * from "./sportsdataio"
export * from "./datagolf"
export * from "./weather"
export * from "./odds"

/** Constructor signature shared by all concrete providers. */
export type ProviderConstructor = new (
  config?: Omit<ProviderConfig, "name">,
) => BaseProvider<unknown, unknown>

/**
 * Registry mapping a provider name to its implementation. New providers are
 * registered here so callers can instantiate by name without importing each
 * class directly.
 */
export const providerRegistry = {
  sportsdataio: SportsDataIoProvider,
  datagolf: DataGolfProvider,
  weather: WeatherProvider,
  odds: OddsProvider,
} satisfies Record<string, ProviderConstructor>

/** Names of all registered providers. */
export type RegisteredProviderName = keyof typeof providerRegistry

/**
 * Instantiate a registered provider by name. Throws if the name is unknown.
 */
export function createProvider(
  name: RegisteredProviderName,
  config?: Omit<ProviderConfig, "name">,
): BaseProvider<unknown, unknown> {
  const Ctor = providerRegistry[name]
  if (!Ctor) {
    throw new Error(`Unknown provider: "${name as ProviderName}"`)
  }
  return new Ctor(config)
}
