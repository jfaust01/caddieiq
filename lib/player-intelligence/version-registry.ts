/**
 * VersionRegistry — Persists versions of all components used to build intelligence
 * 
 * Enables:
 * - Audit trail: "What algorithm generated this confidence value?"
 * - Reproducibility: "Can we recalculate this build with the same logic?"
 * - Evolution tracking: "When did confidence calculation change?"
 * 
 * Each build snapshot contains exact version strings, not references
 */

export interface VersionSnapshot {
  /// Version of the builder (e.g., "1.0.0", "git-abc123def456")
  builderVersion: string

  /// Version of feature schema/definitions (e.g., "schema-v1.5")
  featureSchemaVersion: string

  /// Version of confidence policy (e.g., "confidence-v2.0")
  confidencePolicyVersion: string

  /// Version of activation policy (e.g., "activation-v1.0")
  activationPolicyVersion: string

  /// Individual calculator versions (JSON string for persistence)
  calculatorVersions: string // JSON serialized Map<calculatorName, version>

  /// Timestamp of version snapshot
  capturedAt: Date
}

export class VersionRegistry {
  /**
   * Create version snapshot from current components
   */
  static captureSnapshot(calculatorVersions: Map<string, string>): VersionSnapshot {
    return {
      builderVersion: process.env.BUILDER_VERSION || '15.2.2-alpha',
      featureSchemaVersion: process.env.FEATURE_SCHEMA_VERSION || 'schema-v1.0',
      confidencePolicyVersion: process.env.CONFIDENCE_POLICY_VERSION || 'confidence-v1.0',
      activationPolicyVersion: process.env.ACTIVATION_POLICY_VERSION || 'activation-v1.0',
      calculatorVersions: JSON.stringify(Object.fromEntries(calculatorVersions)),
      capturedAt: new Date(),
    }
  }

  /**
   * Parse calculator versions from snapshot
   */
  static parseCalculatorVersions(snapshotJson: string): Map<string, string> {
    try {
      const parsed = JSON.parse(snapshotJson)
      return new Map(Object.entries(parsed) as [string, string][])
    } catch (error) {
      console.error('[v0] Failed to parse calculator versions:', error)
      return new Map()
    }
  }

  /**
   * Check if versions match (for reproducibility verification)
   */
  static versionsMatch(snapshot1: VersionSnapshot, snapshot2: VersionSnapshot): boolean {
    return (
      snapshot1.builderVersion === snapshot2.builderVersion &&
      snapshot1.featureSchemaVersion === snapshot2.featureSchemaVersion &&
      snapshot1.confidencePolicyVersion === snapshot2.confidencePolicyVersion &&
      snapshot1.activationPolicyVersion === snapshot2.activationPolicyVersion &&
      snapshot1.calculatorVersions === snapshot2.calculatorVersions
    )
  }

  /**
   * Get human-readable version summary
   */
  static formatVersionSummary(snapshot: VersionSnapshot): string {
    return `Builder: ${snapshot.builderVersion}, Schema: ${snapshot.featureSchemaVersion}, Confidence: ${snapshot.confidencePolicyVersion}, Activation: ${snapshot.activationPolicyVersion}`
  }
}

export function getCapturedVersionSnapshot(
  calculatorVersions: Map<string, string>,
): VersionSnapshot {
  return VersionRegistry.captureSnapshot(calculatorVersions)
}
