/**
 * Shared domain primitives.
 *
 * Small, cross-cutting types used by every CaddieIQ domain model. These describe
 * the *domain* vocabulary — never a provider's wire shape. Provider-specific
 * types stay isolated inside `lib/providers`; the domain mappers translate into
 * the shapes defined here and in the sibling domain modules.
 */

/** Known upstream data sources. Extend as new providers are integrated. */
export type DataSourceName = "sportsdataio" | "datagolf" | "manual"

/**
 * Provenance for a domain object sourced from an external provider.
 *
 * Repositories use this to reconcile/upsert a domain record against its origin
 * (e.g. "the SportsDataIO player with external id 40000123"). Carrying it on the
 * domain object keeps the mapping layer free of persistence concerns while still
 * preserving the link a repository will need later.
 */
export interface ExternalReference {
  /** Which provider produced the source record. */
  source: DataSourceName
  /** The provider's native identifier for the record, as a string. */
  externalId: string
}

/**
 * A domain object that originated from (or is linked to) an external provider.
 * Domain models extend this so downstream layers can trace provenance without
 * re-deriving it.
 */
export interface HasExternalReference {
  /** Where this record came from, for reconciliation/upsert. */
  externalRef: ExternalReference
}
