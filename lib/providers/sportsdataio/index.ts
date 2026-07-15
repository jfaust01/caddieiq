/**
 * SportsDataIO provider module.
 *
 * Two layers live here:
 *   - The **client/capability** layer (`client`, `config`, `errors`, `logger`,
 *     `types`) implements the `GolfDataProvider` contract and performs
 *     authenticated, un-normalized reads. This is the first concrete provider.
 *   - The **ingestion** scaffold (`provider`, `normalizer`) plugs into the
 *     BaseProvider import framework; normalization is filled in later and will
 *     consume the client's raw responses.
 */

export * from "./types"
export * from "./config"
export * from "./errors"
export * from "./logger"
export * from "./client"
export * from "./provider"
export * from "./normalizer"
