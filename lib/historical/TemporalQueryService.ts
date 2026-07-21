import { prisma } from '@/lib/prisma';

/**
 * TemporalQueryService: Provides safe historical data access with temporal boundaries.
 *
 * Core responsibilities:
 * 1. Return feature values known before tournament lock
 * 2. Exclude post-lock feature updates
 * 3. Maintain complete provenance
 * 4. Detect and prevent look-ahead leakage
 * 5. Provide snapshot reproducibility guarantees
 */

export interface HistoricalPlayerFeature {
  id: string;
  playerId: string;
  featureKey: string;
  featureVersion: string;
  featureValue: number | string | null;
  unit: string | null;
  validFrom: Date;
  validTo: Date | null;
  systemRecordedAt: Date;
  sourceProvider: string;
  sourceRecordId: string;
  retrievalTimestamp: Date;
  dataQualityStatus: 'verified' | 'estimated' | 'partial' | 'error';
  missingDataReason: string | null;
  transformationVersion: string;
  sealed: boolean;
  sealedAt: Date | null;
}

export interface FeatureSnapshot {
  playerId: string;
  features: Record<string, HistoricalPlayerFeature | null>;
  excludedLateArrivals: HistoricalPlayerFeature[];
  missingFeatures: string[];
  completenessScore: number;
  snapshotTimestamp: Date;
  lockTimestamp: Date;
}

export interface FeatureEligibility {
  eligible: boolean;
  reason: string;
  effectiveValue?: number | string;
  rejectionReason?: string;
}

export class TemporalQueryService {
  /**
   * Get features available AND known before tournament lock
   *
   * Core algorithm:
   * 1. Get tournament lock datetime
   * 2. For each feature, find latest value with:
   *    - valid_from <= lock_datetime
   *    - system_recorded_at < lock_datetime
   *    - NOT sealed (frozen state)
   * 3. Return included and excluded records
   */
  async getFeaturesAvailableAndKnownBefore(
    playerId: string,
    tournamentId: string,
    requiredFeatures?: string[]
  ): Promise<FeatureSnapshot> {
    // Step 1: Get tournament lock datetime
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { lockDatetime: true, id: true },
    });

    if (!tournament?.lockDatetime) {
      throw new Error(`Tournament ${tournamentId} has no lock_datetime set`);
    }

    const lockTimestamp = new Date(tournament.lockDatetime);

    // Step 2: Query features that were known before lock
    const eligibleFeatures = await prisma.$queryRaw<HistoricalPlayerFeature[]>`
      SELECT *
      FROM historical_player_features
      WHERE player_id = ${playerId}
        AND valid_from <= ${lockTimestamp}
        AND system_recorded_at < ${lockTimestamp}
        AND sealed = false
      ORDER BY feature_key, valid_from DESC
    `;

    // Step 3: Identify late-arriving features (excluded from snapshot)
    const lateArrivals = await prisma.$queryRaw<HistoricalPlayerFeature[]>`
      SELECT *
      FROM historical_player_features
      WHERE player_id = ${playerId}
        AND (
          valid_from > ${lockTimestamp}
          OR system_recorded_at >= ${lockTimestamp}
        )
      ORDER BY feature_key, valid_from DESC
    `;

    // Step 4: De-duplicate by feature (keep latest valid one)
    const featureMap = new Map<string, HistoricalPlayerFeature>();
    for (const feature of eligibleFeatures) {
      if (!featureMap.has(feature.featureKey)) {
        featureMap.set(feature.featureKey, feature);
      }
    }

    // Step 5: Calculate completeness
    const requiredSet = new Set(requiredFeatures || []);
    const providedSet = new Set(featureMap.keys());
    const missingFeatures = Array.from(requiredSet).filter((f) => !providedSet.has(f));
    const completenessScore = requiredSet.size > 0 ? providedSet.size / requiredSet.size : 1;

    return {
      playerId,
      features: Object.fromEntries(featureMap),
      excludedLateArrivals: lateArrivals,
      missingFeatures,
      completenessScore,
      snapshotTimestamp: new Date(),
      lockTimestamp,
    };
  }

  /**
   * Get all historical versions of a feature
   */
  async getFeatureHistory(playerId: string, featureKey: string): Promise<HistoricalPlayerFeature[]> {
    const history = await prisma.$queryRaw<HistoricalPlayerFeature[]>`
      SELECT *
      FROM historical_player_features
      WHERE player_id = ${playerId}
        AND feature_key = ${featureKey}
      ORDER BY valid_from DESC, system_recorded_at DESC
    `;

    return history;
  }

  /**
   * Verify specific feature is eligible for use in tournament snapshot
   */
  async verifyFeatureEligibility(
    playerId: string,
    featureKey: string,
    tournamentId: string
  ): Promise<FeatureEligibility> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { lockDatetime: true },
    });

    if (!tournament?.lockDatetime) {
      return {
        eligible: false,
        reason: 'Tournament has no lock datetime',
      };
    }

    const lockTimestamp = new Date(tournament.lockDatetime);

    // Find most recent eligible feature
    const feature = await prisma.$queryRaw<HistoricalPlayerFeature[] | []>`
      SELECT *
      FROM historical_player_features
      WHERE player_id = ${playerId}
        AND feature_key = ${featureKey}
        AND valid_from <= ${lockTimestamp}
        AND system_recorded_at < ${lockTimestamp}
        AND sealed = false
      ORDER BY valid_from DESC
      LIMIT 1
    `;

    if (!feature || feature.length === 0) {
      // Check if late arrival exists
      const lateArrival = await prisma.$queryRaw<HistoricalPlayerFeature[] | []>`
        SELECT *
        FROM historical_player_features
        WHERE player_id = ${playerId}
          AND feature_key = ${featureKey}
        ORDER BY system_recorded_at DESC
        LIMIT 1
      `;

      if (lateArrival && lateArrival.length > 0) {
        return {
          eligible: false,
          reason: `Feature ${featureKey} arrived after tournament lock`,
          rejectionReason: `System recorded at ${lateArrival[0].systemRecordedAt}, lock was ${lockTimestamp}`,
        };
      }

      return {
        eligible: false,
        reason: `Feature ${featureKey} not found before lock`,
      };
    }

    return {
      eligible: true,
      reason: `Feature eligible from ${feature[0].validFrom}`,
      effectiveValue: feature[0].featureValue ?? undefined,
    };
  }

  /**
   * Seal a feature immutably (no further updates allowed)
   */
  async sealFeature(featureId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE historical_player_features
      SET sealed = true, sealed_at = NOW()
      WHERE id = ${featureId} AND sealed = false
    `;
  }

  /**
   * Audit snapshot generation (deterministic hash)
   */
  async generateSnapshotHash(snapshot: FeatureSnapshot): Promise<string> {
    const crypto = require('crypto');

    // Deterministic snapshot representation
    const canonical = JSON.stringify({
      playerId: snapshot.playerId,
      lockTimestamp: snapshot.lockTimestamp.toISOString(),
      features: Object.entries(snapshot.features)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, feature]) => [
          key,
          feature ? {
            value: feature.featureValue,
            validFrom: feature.validFrom.toISOString(),
            sourceProvider: feature.sourceProvider,
            sourceRecordId: feature.sourceRecordId,
          } : null,
        ]),
    });

    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Validate snapshot determinism (reproducibility check)
   */
  async verifySnapshotDeterminism(
    playerId: string,
    tournamentId: string,
    firstHash: string,
    requiredFeatures?: string[]
  ): Promise<{
    deterministic: boolean;
    hashMatch: boolean;
    differences: string[];
  }> {
    // Regenerate snapshot
    const secondSnapshot = await this.getFeaturesAvailableAndKnownBefore(
      playerId,
      tournamentId,
      requiredFeatures
    );

    const secondHash = await this.generateSnapshotHash(secondSnapshot);

    const differences: string[] = [];

    if (firstHash !== secondHash) {
      differences.push(`Hash mismatch: ${firstHash} vs ${secondHash}`);
    }

    return {
      deterministic: firstHash === secondHash,
      hashMatch: firstHash === secondHash,
      differences,
    };
  }

  /**
   * Check for post-lock feature leakage
   */
  async detectPostLockLeakage(tournamentId: string): Promise<{
    hasLeakage: boolean;
    leakageCount: number;
    affectedPlayers: string[];
  }> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { lockDatetime: true },
    });

    if (!tournament?.lockDatetime) {
      throw new Error(`Tournament ${tournamentId} has no lock_datetime`);
    }

    const lockTimestamp = new Date(tournament.lockDatetime);

    // Find features recorded after lock
    const postLockFeatures = await prisma.$queryRaw<
      Array<{ playerId: string; count: number }>
    >`
      SELECT DISTINCT player_id as "playerId", COUNT(*) as count
      FROM historical_player_features hpf
      WHERE system_recorded_at > ${lockTimestamp}
        AND sealed = true
      GROUP BY player_id
    `;

    return {
      hasLeakage: postLockFeatures.length > 0,
      leakageCount: postLockFeatures.reduce((sum, row) => sum + row.count, 0),
      affectedPlayers: postLockFeatures.map((row) => row.playerId),
    };
  }
}

export const temporalQueryService = new TemporalQueryService();
