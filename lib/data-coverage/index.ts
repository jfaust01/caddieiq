/**
 * Public, client-safe surface of the Data Coverage module.
 *
 * The aggregation service (`./service`) is `server-only` and must be imported
 * directly by server components — it is deliberately NOT re-exported here so a
 * client component can safely import the pure ratings helpers and types.
 */
export * from "./ratings"
export * from "./inventory"
export type * from "./types"
