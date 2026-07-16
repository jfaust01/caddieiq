/**
 * Odds Intelligence — client-safe barrel.
 *
 * Exposes the pure math/consensus core and the engine types. It deliberately
 * does NOT re-export the `server-only` service, so UI components can import
 * types and formatting helpers without pulling server code into the bundle.
 */

export * from "./types"
export * from "./math"
export * from "./consensus"
