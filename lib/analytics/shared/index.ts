/**
 * Shared analytics framework: interfaces, base module, errors, logging, and
 * deterministic mock helpers. Concrete modules import from here rather than
 * reaching into individual files.
 */

export * from "./types"
export * from "./errors"
export * from "./logger"
export * from "./mock"
export * from "./base-module"
