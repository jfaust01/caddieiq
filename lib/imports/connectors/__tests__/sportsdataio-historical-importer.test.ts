import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SportsDataIOHistoricalImporter } from '../sportsdataio-historical-importer';
import type { RawRecord } from '../../historical-importer';

describe('SportsDataIOHistoricalImporter', () => {
  let importer: SportsDataIOHistoricalImporter;
  const mockPrisma = {} as any;

  beforeEach(() => {
    importer = new SportsDataIOHistoricalImporter(mockPrisma, {
      apiKey: 'test-key',
      baseUrl: 'https://api.sportsdata.io/golf/v2',
      timeoutMs: 10000,
      maxRetries: 2,
    });
  });

  describe('getProviderId', () => {
    it('returns sportsdataio', () => {
      expect(importer.getProviderId()).toBe('sportsdataio');
    });
  });

  describe('getDatasetType', () => {
    it('returns GOLF_HISTORICAL', () => {
      expect(importer.getDatasetType()).toBe('GOLF_HISTORICAL');
    });
  });

  describe('normalize', () => {
    it('normalizes tournament records', () => {
      const rawRecords: RawRecord[] = [
        {
          providerRecordId: 'tournament-123',
          sourceEffectiveTimestamp: new Date('2025-02-15'),
          payload: {
            type: 'tournament',
            data: {
              TournamentID: 123,
              Name: 'Test Tournament',
              Venue: 'Test Course',
              Location: 'Test City',
              StartDate: '2025-02-15',
              EndDate: '2025-02-18',
              IsOver: true,
              Par: 72,
              Yards: 7000,
            },
          },
          metadata: { datasetName: 'TOURNAMENT_METADATA' },
        },
      ];

      const normalized = importer.normalize(rawRecords);

      expect(normalized).toHaveLength(1);
      expect(normalized[0].provider).toBe('sportsdataio');
      expect(normalized[0].fields.recordType).toBe('tournament');
      expect(normalized[0].canonicalId).toBe('tournament_123');
    });

    it('normalizes leaderboard outcome records', () => {
      const rawRecords: RawRecord[] = [
        {
          providerRecordId: 'leaderboard-123-456',
          sourceEffectiveTimestamp: new Date('2025-02-18'),
          payload: {
            type: 'leaderboard_entry',
            tournamentId: 123,
            playerData: {
              PlayerID: 456,
              FirstName: 'John',
              LastName: 'Doe',
              Country: 'USA',
            },
          },
          metadata: { datasetName: 'TOURNAMENT_OUTCOMES' },
        },
      ];

      const normalized = importer.normalize(rawRecords);

      expect(normalized).toHaveLength(1);
      expect(normalized[0].fields.recordType).toBe('outcome');
      expect(normalized[0].fields.playerId).toBe(456);
      expect(normalized[0].canonicalId).toBe('outcome_123_456');
    });

    it('skips malformed records gracefully', () => {
      const rawRecords: RawRecord[] = [
        {
          providerRecordId: 'bad-record',
          sourceEffectiveTimestamp: new Date(),
          payload: { type: 'unknown_type' },
          metadata: { datasetName: 'TEST' },
        },
      ];

      const normalized = importer.normalize(rawRecords);

      expect(normalized).toHaveLength(0);
    });
  });

  describe('validate', () => {
    it('accepts valid records', async () => {
      const records = [
        {
          canonicalId: 'test-1',
          provider: 'sportsdataio' as const,
          providerRecordId: 'prov-1',
          sourceEffectiveTimestamp: new Date('2025-02-15'),
          retrievedTimestamp: new Date(),
          checksum: 'abc123',
          validFrom: new Date('2025-02-15'),
          validTo: null,
          fields: { recordType: 'tournament' as const },
          metadata: {},
        },
      ];

      const result = await importer.validate(records);

      expect(result.valid).toHaveLength(1);
      expect(result.rejected).toHaveLength(0);
      expect(result.stats.passedCount).toBe(1);
      expect(result.isHealthy).toBe(true);
    });

    it('rejects records past cutoff date', async () => {
      const cutoff = new Date('2025-02-15');
      const records = [
        {
          canonicalId: 'test-1',
          provider: 'sportsdataio' as const,
          providerRecordId: 'prov-1',
          sourceEffectiveTimestamp: new Date('2025-02-20'), // After cutoff
          retrievedTimestamp: new Date(),
          checksum: 'abc123',
          validFrom: new Date('2025-02-20'),
          validTo: null,
          fields: { recordType: 'tournament' as const },
          metadata: {},
        },
      ];

      const result = await importer.validate(records, cutoff);

      expect(result.valid).toHaveLength(0);
      expect(result.rejected).toHaveLength(1);
      expect(result.stats.temporalViolationCount).toBe(1);
      expect(result.isHealthy).toBe(false);
    });

    it('detects duplicate canonical IDs', async () => {
      const records = [
        {
          canonicalId: 'test-1',
          provider: 'sportsdataio' as const,
          providerRecordId: 'prov-1',
          sourceEffectiveTimestamp: new Date('2025-02-15'),
          retrievedTimestamp: new Date(),
          checksum: 'abc123',
          validFrom: new Date('2025-02-15'),
          validTo: null,
          fields: { recordType: 'tournament' as const },
          metadata: {},
        },
        {
          canonicalId: 'test-1', // Duplicate
          provider: 'sportsdataio' as const,
          providerRecordId: 'prov-2',
          sourceEffectiveTimestamp: new Date('2025-02-15'),
          retrievedTimestamp: new Date(),
          checksum: 'def456',
          validFrom: new Date('2025-02-15'),
          validTo: null,
          fields: { recordType: 'tournament' as const },
          metadata: {},
        },
      ];

      const result = await importer.validate(records);

      expect(result.valid).toHaveLength(1);
      expect(result.rejected).toHaveLength(1);
      expect(result.stats.duplicateCount).toBe(1);
      expect(result.isHealthy).toBe(false);
    });
  });

  describe('persist', () => {
    it('returns inserted and updated counts', async () => {
      const records = [
        {
          canonicalId: 'test-1',
          provider: 'sportsdataio' as const,
          providerRecordId: 'prov-1',
          sourceEffectiveTimestamp: new Date(),
          retrievedTimestamp: new Date(),
          checksum: 'abc123',
          validFrom: new Date(),
          validTo: null,
          fields: { recordType: 'tournament' as const },
          metadata: {},
        },
      ];

      mockPrisma.$transaction = vi.fn(async (fn: any) => fn(mockPrisma));

      const result = await importer.persist(records, 'job-123');

      expect(result.inserted).toBeGreaterThanOrEqual(0);
      expect(result.updated).toBeGreaterThanOrEqual(0);
    });
  });

  describe('verify', () => {
    it('returns verification result', async () => {
      const result = await importer.verify('job-123');

      expect(result.recordsVerified).toBeDefined();
      expect(result.integrityChecksPassed).toBe(true);
      expect(result.checksumVerified).toBe(true);
    });
  });
});
