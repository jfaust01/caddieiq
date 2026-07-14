/**
 * CaddieIQ Golf Intelligence framework.
 *
 * This is the architecture layer that powers every ranking, model, AI
 * explanation, and tournament insight. It defines shared contracts
 * ({@link AnalyticsModule}, {@link AnalyticsResult}, {@link MetricScore},
 * {@link PlayerInsight}, …), a {@link BaseAnalyticsModule} that supplies
 * logging/timing/error handling, standardized error classes, and seven
 * scaffolded modules (recent form, course fit, strokes gained, wind,
 * consistency, value, momentum) orchestrated by the {@link AnalyticsEngine}.
 *
 * No real analytics run here yet: every module returns realistic, deterministic
 * mock values, with `TODO(sportsdataio)` markers where normalized provider data
 * will plug in. No network calls and no business calculations live here.
 */

import { AnalyticsEngine, type AnalyticsEngineOptions } from "./engine"
import { ConsistencyModule } from "./consistency"
import { CourseFitModule } from "./course-fit"
import { MomentumModule } from "./momentum"
import { RecentFormModule } from "./recent-form"
import type { AnalyticsLogSink } from "./shared/logger"
import type { AnalyticsModule, AnalyticsModuleKey, ModuleWeights } from "./shared/types"
import { StrokesGainedModule } from "./strokes-gained"
import { ValueModule } from "./value"
import { WindModule } from "./wind"

export * from "./shared"
export * from "./engine"
export { RecentFormModule } from "./recent-form"
export { CourseFitModule } from "./course-fit"
export { StrokesGainedModule } from "./strokes-gained"
export { WindModule } from "./wind"
export { ConsistencyModule } from "./consistency"
export { ValueModule } from "./value"
export { MomentumModule } from "./momentum"

/** Constructor signature shared by all analytics modules. */
export type AnalyticsModuleConstructor = new (
  logSink?: AnalyticsLogSink,
) => AnalyticsModule

/**
 * Registry mapping a module key to its implementation. New modules are
 * registered here so callers can instantiate by key without importing each
 * class directly.
 */
export const moduleRegistry = {
  "recent-form": RecentFormModule,
  "course-fit": CourseFitModule,
  "strokes-gained": StrokesGainedModule,
  wind: WindModule,
  consistency: ConsistencyModule,
  value: ValueModule,
  momentum: MomentumModule,
} satisfies Record<AnalyticsModuleKey, AnalyticsModuleConstructor>

/** Keys of all registered modules. */
export type RegisteredModuleKey = keyof typeof moduleRegistry

/** Instantiate a registered module by key. Throws if the key is unknown. */
export function createModule(
  key: RegisteredModuleKey,
  logSink?: AnalyticsLogSink,
): AnalyticsModule {
  const Ctor = moduleRegistry[key]
  if (!Ctor) {
    throw new Error(`Unknown analytics module: "${key as string}"`)
  }
  return new Ctor(logSink)
}

/** Instantiate every registered module. */
export function createAllModules(logSink?: AnalyticsLogSink): AnalyticsModule[] {
  return (Object.keys(moduleRegistry) as RegisteredModuleKey[]).map((key) =>
    createModule(key, logSink),
  )
}

/**
 * Build an {@link AnalyticsEngine} pre-loaded with the requested modules (all
 * of them by default). This is the primary entry point for callers.
 */
export function createEngine(
  options: {
    only?: RegisteredModuleKey[]
    defaultWeights?: ModuleWeights
    logSink?: AnalyticsLogSink
  } = {},
): AnalyticsEngine {
  const keys = options.only ?? (Object.keys(moduleRegistry) as RegisteredModuleKey[])
  const modules = keys.map((key) => createModule(key, options.logSink))
  const engineOptions: AnalyticsEngineOptions = {
    modules,
    defaultWeights: options.defaultWeights,
    logSink: options.logSink,
  }
  return new AnalyticsEngine(engineOptions)
}
