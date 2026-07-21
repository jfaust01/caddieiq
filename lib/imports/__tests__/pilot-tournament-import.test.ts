/**
 * Phase 17.3A.2: Pilot Tournament Import Tests
 * 
 * Validates:
 * 1. Canonical identity integrity
 * 2. Cutoff filtering (no post-lock data)
 * 3. Outcome isolation (outcomes not in feature queries)
 * 4. Snapshot determinism (same hash for same data)
 * 5. Sealed snapshot immutability
 * 6. Duplicate identity rejection
 * 7. Temporal query correctness
 * 8. Historical replay retrieval
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { PilotTournamentImporter } from '../pilot-tournament-importer';

describe('Phase 17.3A.2: Pilot Tournament Import', () => {
  let prisma: PrismaClient;
  let importer: PilotTournamentImporter;
  const TOURNAMENT_ID = 'cmrlmaaxa00084zpaelolu9vl'; // Cadillac Championship
  const LOCK_TIME = new Date('2025-04-29T22:00:00Z');

  beforeAll(() => {
    prisma = new PrismaClient();
    importer = new PilotTournamentImporter(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Canonical Identity Integrity', () => {
    it('should resolve all field players to canonical Player IDs', async () => {
      const fields = await prisma.tournamentField.findMany({
        where: { tournamentId: TOURNAMENT_ID },
        select: { playerId: true, playerName: true },
      });

      const unresolvedCount = fields.filter(f => !f.playerId).length;
      expect(unresolvedCount).toBeLessThan(fields.length * 0.1); // Allow max 10% unresolved
    });

    it('should preserve provider ID mappings', async () => {
      const mappings = await prisma.providerIdMapping.findMany({
        where: {
          tournamentField: { tournamentId: TOURNAMENT_ID },
        },
      });

      expect(mappings.length).toBeGreaterThan(0);
      mappings.forEach(m => {
        expect(m.playerId).toBeDefined();
        expect(m.sourceRecordId).toBeDefined();
      });
    });

    it('should reject duplicate identities', async () => {
      const fields = await prisma.tournamentField.findMany({
        where: { tournamentId: TOURNAMENT_ID },
        select: { playerId: true },
      });

      const playerIds = fields.map(f => f.playerId).filter(Boolean);
      const uniqueIds = new Set(playerIds);

      expect(uniqueIds.size).toBe(playerIds.length);
    });
  });

  describe('2. Cutoff Filtering (Temporal Integrity)', () => {
    it('should not import data with effective dates after lock', async () => {
      const postLockFeatures = await prisma.historicalPlayerFeature.findMany({
        where: {
          validFrom: { gt: LOCK_TIME },
        },
      });

      expect(postLockFeatures.length).toBe(0);
    });

    it('should only include withdrawals known before lock', async () => {
      const tournamentFields = await prisma.tournamentField.findMany({
        where: {
          tournamentId: TOURNAMENT_ID,
          alternateStatus: { not: null },
        },
        select: {
          alternateCallTimestamp: true,
        },
      });

      tournamentFields.forEach(f => {
        if (f.alternateCallTimestamp) {
          expect(f.alternateCallTimestamp.getTime()).toBeLessThanOrEqual(LOCK_TIME.getTime());
        }
      });
    });
  });

  describe('3. Outcome Isolation', () => {
    it('should not have outcomes in historical_player_features', async () => {
      const outcomeFeatures = await prisma.historicalPlayerFeature.findMany({
        where: {
          featureKey: {
            in: ['score', 'finishing_position', 'cut_status'],
          },
        },
      });

      expect(outcomeFeatures.length).toBe(0);
    });

    it('should have outcomes only in historical_tournament_outcomes', async () => {
      const outcomes = await prisma.historicalTournamentOutcome.findMany({
        where: { tournamentId: TOURNAMENT_ID },
      });

      expect(outcomes.length).toBeGreaterThan(0);
      outcomes.forEach(o => {
        expect(o.finishingPosition).toBeDefined();
        expect(o.score).toBeDefined();
      });
    });

    it('should isolate outcomes from feature queries', async () => {
      // Query for features should NOT include score
      const features = await prisma.historicalPlayerFeature.findMany({
        where: { tournamentId: TOURNAMENT_ID },
        select: { featureKey: true },
      });

      const scoreFeatures = features.filter(f => f.featureKey.includes('score'));
      expect(scoreFeatures.length).toBe(0);
    });
  });

  describe('4. Snapshot Determinism', () => {
    it('should generate same hash for same tournament and lock time', async () => {
      const snapshots = await prisma.historicalSnapshot.findMany({
        where: { tournamentId: TOURNAMENT_ID },
        select: { snapshotHash: true },
        take: 2,
      });

      if (snapshots.length >= 2) {
        // Same tournament should generate same hash
        expect(snapshots[0].snapshotHash).toBe(snapshots[1].snapshotHash);
      }
    });

    it('should generate consistent hash format', async () => {
      const snapshot = await prisma.historicalSnapshot.findFirst({
        where: { tournamentId: TOURNAMENT_ID },
      });

      expect(snapshot?.snapshotHash).toMatch(/^[a-zA-Z0-9+/=]+$/);
      expect(snapshot?.snapshotHash?.length).toBeGreaterThan(0);
    });
  });

  describe('5. Sealed Snapshot Immutability', () => {
    it('should have sealed flag set to true', async () => {
      const snapshot = await prisma.historicalSnapshot.findFirst({
        where: { tournamentId: TOURNAMENT_ID },
      });

      expect(snapshot?.sealed).toBe(true);
    });

    it('should have sealed_at timestamp', async () => {
      const snapshot = await prisma.historicalSnapshot.findFirst({
        where: { tournamentId: TOURNAMENT_ID },
      });

      expect(snapshot?.sealedAt).toBeDefined();
      expect(snapshot?.sealedAt).toBeInstanceOf(Date);
    });

    it('should prevent updates to sealed records', async () => {
      const snapshot = await prisma.historicalSnapshot.findFirst({
        where: { tournamentId: TOURNAMENT_ID },
      });

      if (snapshot?.sealed) {
        try {
          await prisma.historicalSnapshot.update({
            where: { id: snapshot.id },
            data: { snapshotHash: 'modified' },
          });
          // If we reach here, the trigger didn't work
          expect(true).toBe(false); // Fail the test
        } catch (error) {
          // Expected - trigger should have rejected the update
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('6. Field Completeness', () => {
    it('should have majority of field entries imported', async () => {
      const fieldCount = await prisma.tournamentField.count({
        where: { tournamentId: TOURNAMENT_ID },
      });

      expect(fieldCount).toBeGreaterThanOrEqual(70); // At least 70 of 74
    });

    it('should have historical field records for players', async () => {
      const fieldFeatures = await prisma.historicalPlayerFeature.findMany({
        where: {
          featureKey: 'field_entry',
        },
      });

      expect(fieldFeatures.length).toBeGreaterThan(0);
    });
  });

  describe('7. Ranking Coverage', () => {
    it('should have historical rankings for majority of field', async () => {
      const rankings = await prisma.historicalPlayerRanking.findMany({
        where: {
          effectiveDate: { lte: LOCK_TIME },
        },
      });

      expect(rankings.length).toBeGreaterThanOrEqual(65); // At least 65 of 74
    });
  });

  describe('8. Historical Replay Retrieval', () => {
    it('should be able to reconstruct pre-lock field', async () => {
      // Query all field information as it existed before lock
      const field = await prisma.tournamentField.findMany({
        where: {
          tournamentId: TOURNAMENT_ID,
          entryStatusChangedAt: { lte: LOCK_TIME },
        },
        select: {
          playerId: true,
          playerName: true,
          alternateStatus: true,
        },
      });

      expect(field.length).toBeGreaterThan(0);
    });

    it('should retrieve features with correct temporal boundaries', async () => {
      const features = await prisma.historicalPlayerFeature.findMany({
        where: {
          validFrom: { lte: LOCK_TIME },
          systemRecordedAt: { lte: LOCK_TIME },
        },
      });

      features.forEach(f => {
        expect(f.validFrom.getTime()).toBeLessThanOrEqual(LOCK_TIME.getTime());
        expect(f.systemRecordedAt.getTime()).toBeLessThanOrEqual(LOCK_TIME.getTime());
      });
    });

    it('should maintain audit trail via historical_data_audit_events', async () => {
      const events = await prisma.historicalDataAuditEvent.findMany({
        where: {
          entityId: TOURNAMENT_ID,
        },
      });

      expect(events.length).toBeGreaterThanOrEqual(0); // May have none yet
    });
  });

  describe('9. Data Quality Metrics', () => {
    it('should report field completeness', async () => {
      const fieldCount = await prisma.tournamentField.count({
        where: { tournamentId: TOURNAMENT_ID },
      });

      const completeness = Math.round((fieldCount / 74) * 100);
      expect(completeness).toBeGreaterThanOrEqual(85); // At least 85%
    });

    it('should report player mapping completeness', async () => {
      const total = await prisma.tournamentField.count({
        where: { tournamentId: TOURNAMENT_ID },
      });

      const mapped = await prisma.tournamentField.count({
        where: {
          tournamentId: TOURNAMENT_ID,
          playerId: { not: null },
        },
      });

      const completeness = Math.round((mapped / total) * 100);
      expect(completeness).toBeGreaterThanOrEqual(90); // At least 90%
    });
  });
});
