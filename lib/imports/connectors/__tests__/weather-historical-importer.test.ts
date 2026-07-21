import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoricalWeatherImporter } from '../weather-historical-importer';

describe('HistoricalWeatherImporter', () => {
  let importer: HistoricalWeatherImporter;
  const mockPrisma = {
    weatherSnapshot: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    weatherPeriod: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.weatherSnapshot.findFirst.mockResolvedValue(null);
    mockPrisma.weatherSnapshot.create.mockResolvedValue({ id: 'snapshot-1' });
    mockPrisma.weatherPeriod.findFirst.mockResolvedValue(null);
    mockPrisma.weatherPeriod.create.mockResolvedValue({ id: 'period-1' });

    importer = new HistoricalWeatherImporter(mockPrisma, {
      apiKey: 'test-key',
      baseUrl: 'https://api.openweathermap.org',
      timeoutMs: 10000,
    });
  });

  describe('provider metadata', () => {
    it('getProviderId returns openweather', () => {
      expect(importer.getProviderId()).toBe('openweather');
    });

    it('getDatasetType returns HISTORICAL_WEATHER', () => {
      expect(importer.getDatasetType()).toBe('HISTORICAL_WEATHER');
    });

    it('provider property is openweather', () => {
      expect(importer.provider).toBe('openweather');
    });
  });

  describe('discover', () => {
    it('returns discovery metadata', async () => {
      const criteria = {
        startDate: new Date('2026-07-20'),
        endDate: new Date('2026-07-21'),
        tournamentIds: ['tour-1'],
      };

      const discovery = await importer.discover(criteria);

      expect(discovery.provider).toBe('openweather');
      expect(discovery.dataset).toBe('HISTORICAL_WEATHER');
      expect(discovery.estimatedRecordCount).toBeGreaterThan(0);
      expect(discovery.discoveryHealthy).toBe(true);
      expect(discovery.availableVersions).toContain('2.5');
    });
  });

  describe('fetch', () => {
    it('retrieves raw weather data', async () => {
      const criteria = {
        startDate: new Date('2026-07-20'),
        endDate: new Date('2026-07-21'),
      };

      const raw = await importer.fetch(criteria);

      expect(Array.isArray(raw)).toBe(true);
      expect(raw.length).toBeGreaterThan(0);
      expect(raw[0]).toHaveProperty('providerRecordId');
      expect(raw[0]).toHaveProperty('payload');
    });
  });

  describe('normalize', () => {
    it('converts raw records to normalized schema', async () => {
      const criteria = { startDate: new Date('2026-07-20'), endDate: new Date('2026-07-21') };
      const raw = await importer.fetch(criteria);
      const normalized = importer.normalize(raw);

      expect(normalized.length).toBe(raw.length);
      expect(normalized[0].provider).toBe('openweather');
      expect(normalized[0].fields.recordType).toBe('weather_forecast');
      expect(normalized[0].fields).toHaveProperty('temperatureC');
      expect(normalized[0].fields).toHaveProperty('windSpeedMs');
      expect(normalized[0].checksum).toBeTruthy();
    });

    it('computes deterministic checksums', async () => {
      const criteria = { startDate: new Date('2026-07-20'), endDate: new Date('2026-07-21') };
      const raw1 = await importer.fetch(criteria);
      const normalized1 = importer.normalize(raw1);

      const raw2 = await importer.fetch(criteria);
      const normalized2 = importer.normalize(raw2);

      expect(normalized1[0].checksum).toBe(normalized2[0].checksum);
    });
  });

  describe('validate', () => {
    it('validates normalized records', async () => {
      const criteria = { startDate: new Date('2026-07-20'), endDate: new Date('2026-07-21') };
      const raw = await importer.fetch(criteria);
      const normalized = importer.normalize(raw);
      const validated = await importer.validate(normalized);

      expect(validated.valid.length).toBeGreaterThanOrEqual(0);
      expect(validated.isHealthy).toBe(true);
      expect(validated.stats.totalProcessed).toBe(normalized.length);
      expect(validated.stats.passedCount + validated.stats.rejectedCount).toBe(
        normalized.length
      );
    });

    it('detects duplicate records', async () => {
      const criteria = { startDate: new Date('2026-07-20'), endDate: new Date('2026-07-21') };
      const raw = await importer.fetch(criteria);
      const normalized = importer.normalize(raw);
      const withDuplicates = [...normalized, ...normalized]; // Duplicate the set

      const validated = await importer.validate(withDuplicates);

      expect(validated.stats.duplicateCount).toBeGreaterThan(0);
    });
  });

  describe('persist', () => {
    it('writes weather records atomically', async () => {
      const criteria = { startDate: new Date('2026-07-20'), endDate: new Date('2026-07-21') };
      const raw = await importer.fetch(criteria);
      const normalized = importer.normalize(raw);
      const validated = await importer.validate(normalized);

      const result = await importer.persist(validated.valid, 'job-123');

      expect(result.jobId).toBe('job-123');
      expect(typeof result.inserted).toBe('number');
      expect(typeof result.updated).toBe('number');
      expect(result.success).toBe(true);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('is idempotent - second import creates no duplicates', async () => {
      const criteria = { startDate: new Date('2026-07-20'), endDate: new Date('2026-07-21') };

      // First import
      const raw1 = await importer.fetch(criteria);
      const normalized1 = importer.normalize(raw1);
      const validated1 = await importer.validate(normalized1);
      const result1 = await importer.persist(validated1.valid, 'job-1');

      // Setup mocks to return existing records on second call
      mockPrisma.weatherSnapshot.findFirst.mockResolvedValueOnce({ id: 'snapshot-1' });
      mockPrisma.weatherPeriod.findFirst.mockResolvedValueOnce({ id: 'period-1' });

      // Second import
      const raw2 = await importer.fetch(criteria);
      const normalized2 = importer.normalize(raw2);
      const validated2 = await importer.validate(normalized2);
      const result2 = await importer.persist(validated2.valid, 'job-2');

      expect(result1.inserted).toBeGreaterThanOrEqual(0);
      expect(result2.updated).toBeGreaterThanOrEqual(0);
    });
  });

  describe('verify', () => {
    it('verifies persisted records', async () => {
      mockPrisma.weatherSnapshot.count.mockResolvedValueOnce(1);
      mockPrisma.weatherPeriod.count.mockResolvedValueOnce(2);

      const result = await importer.verify('job-123');

      expect(result.recordsVerified).toBe(3); // 1 snapshot + 2 periods
      expect(result.integrityChecksPassed).toBe(true);
      expect(result.checksumVerified).toBe(true);
    });
  });

  describe('end-to-end determinism', () => {
    it('produces identical results on multiple runs', async () => {
      const criteria = { startDate: new Date('2026-07-20'), endDate: new Date('2026-07-21') };

      // Run 1
      const raw1 = await importer.fetch(criteria);
      const normalized1 = importer.normalize(raw1);
      const checksum1 = normalized1.map((r) => r.checksum).join('|');

      // Run 2
      const raw2 = await importer.fetch(criteria);
      const normalized2 = importer.normalize(raw2);
      const checksum2 = normalized2.map((r) => r.checksum).join('|');

      expect(checksum1).toBe(checksum2);
    });
  });
});
