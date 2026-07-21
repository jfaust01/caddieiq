import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DraftKingsHistoricalImporter } from '../draftkings-historical-importer';

describe('DraftKingsHistoricalImporter', () => {
  let importer: DraftKingsHistoricalImporter;
  const mockPrisma = {
    dfsSalary: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.dfsSalary.findFirst.mockResolvedValue(null);
    mockPrisma.dfsSalary.create.mockResolvedValue({ id: 'salary-1' });

    importer = new DraftKingsHistoricalImporter(mockPrisma);
  });

  describe('getProviderId', () => {
    it('returns draftkings', () => {
      expect(importer.getProviderId()).toBe('draftkings');
    });
  });

  describe('getDatasetType', () => {
    it('returns DRAFTKINGS_SALARIES', () => {
      expect(importer.getDatasetType()).toBe('DRAFTKINGS_SALARIES');
    });
  });

  describe('discover', () => {
    it('returns available DraftKings slates', async () => {
      const result = await importer.discover();

      expect(result.provider).toBe('draftkings');
      expect(result.discoveryHealthy).toBe(true);
      expect(result.estimatedRecordCount).toBeGreaterThan(0);
    });
  });

  describe('fetch', () => {
    it('fetches mock DraftKings salary data', async () => {
      const criteria = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      };

      const raw = await importer.fetch(criteria);

      expect(raw.length).toBeGreaterThan(0);
      expect(raw[0].providerRecordId).toBeDefined();
      expect(raw[0].payload).toBeDefined();
      expect(raw[0].sourceEffectiveTimestamp).toBeDefined();
    });
  });

  describe('normalize', () => {
    it('normalizes raw records to canonical schema', async () => {
      const criteria = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      };
      const raw = await importer.fetch(criteria);
      const normalized = importer.normalize(raw);

      expect(normalized.length).toBe(raw.length);
      expect(normalized[0].provider).toBe('draftkings');
      expect(normalized[0].canonicalId).toBeDefined();
      expect(normalized[0].checksum).toBeDefined();
      expect(normalized[0].fields).toBeDefined();
    });
  });

  describe('validate', () => {
    it('validates normalized records', async () => {
      const criteria = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      };
      const raw = await importer.fetch(criteria);
      const normalized = importer.normalize(raw);
      const result = await importer.validate(normalized);

      expect(result.isHealthy).toBe(true);
      expect(result.valid.length).toBeGreaterThan(0);
      expect(result.stats.passedCount).toBeGreaterThan(0);
    });
  });

  describe('persist', () => {
    it('persists validated records', async () => {
      const criteria = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      };
      const raw = await importer.fetch(criteria);
      const normalized = importer.normalize(raw);
      const result = await importer.persist(normalized, 'job-123');

      expect(result.jobId).toBe('job-123');
      expect(result.inserted).toBeGreaterThanOrEqual(0);
      expect(result.updated).toBeGreaterThanOrEqual(0);
      expect(typeof result.executionTimeMs).toBe('number');
    });
  });

  describe('verify', () => {
    it('verifies persisted records', async () => {
      const result = await importer.verify('job-123');

      expect(result.recordsVerified).toBeGreaterThanOrEqual(0);
      expect(result.integrityChecksPassed).toBe(true);
      expect(result.checksumVerified).toBe(true);
    });
  });

  describe('determinism', () => {
    it('produces identical records on multiple fetches', async () => {
      const criteria = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      };

      const raw1 = await importer.fetch(criteria);
      const normalized1 = importer.normalize(raw1);

      const raw2 = await importer.fetch(criteria);
      const normalized2 = importer.normalize(raw2);

      expect(normalized1.length).toBe(normalized2.length);
      expect(normalized1[0].checksum).toBe(normalized2[0].checksum);
    });
  });
});
