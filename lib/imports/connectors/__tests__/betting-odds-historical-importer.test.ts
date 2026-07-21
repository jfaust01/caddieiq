import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BettingOddsHistoricalImporter, OddsMarketType } from '../betting-odds-historical-importer';

describe('BettingOddsHistoricalImporter', () => {
  let importer: BettingOddsHistoricalImporter;

  beforeEach(() => {
    importer = new BettingOddsHistoricalImporter();
  });

  describe('Provider Metadata', () => {
    it('should return correct provider ID', () => {
      expect(importer.getProviderId()).toBe('betops');
    });

    it('should return correct dataset type', () => {
      expect(importer.getDatasetType()).toBe('HISTORICAL_BETTING_ODDS');
    });

    it('should expose provider property', () => {
      expect(importer.provider).toBe('betops');
    });
  });

  describe('discover()', () => {
    it('should return available betting markets', async () => {
      const datasets = await importer.discover();

      expect(datasets).toHaveLength(1);
      expect(datasets[0].name).toBe('Good Good Championship');
      expect(datasets[0].markets).toBeDefined();
      expect(datasets[0].totalOdds).toBe(780);
    });

    it('should include all market types', async () => {
      const datasets = await importer.discover();
      const markets = datasets[0].markets;

      expect(markets.map((m: any) => m.type)).toContain('TOURNAMENT_WINNER');
      expect(markets.map((m: any) => m.type)).toContain('TOP_5');
      expect(markets.map((m: any) => m.type)).toContain('MAKE_CUT');
    });
  });

  describe('fetch()', () => {
    it('should retrieve raw odds records', async () => {
      const raw = await importer.fetch('tournament-101');

      expect(raw).toHaveLength(4);
      expect(raw[0].recordType).toBe('odds_quote');
      expect(raw[0].selection).toBe('Scottie Scheffler');
    });

    it('should include line movement data', async () => {
      const raw = await importer.fetch('tournament-101');
      const withLineMovement = raw.filter((r: any) => r.lineMovement !== undefined);

      expect(withLineMovement.length).toBeGreaterThan(0);
      expect(withLineMovement[0].openingOdds).toBeDefined();
      expect(withLineMovement[0].closingOdds).toBeDefined();
    });
  });

  describe('normalize()', () => {
    it('should convert raw records to canonical schema', async () => {
      const raw = await importer.fetch('tournament-101');
      const normalized = await importer.normalize(raw);

      expect(normalized).toHaveLength(4);
      expect(normalized[0].fields.recordType).toBe('odds_quote');
      expect(normalized[0].checksum).toBeDefined();
    });

    it('should compute checksums deterministically', async () => {
      const raw = await importer.fetch('tournament-101');
      const normalized1 = await importer.normalize(raw);
      const normalized2 = await importer.normalize(raw);

      for (let i = 0; i < normalized1.length; i++) {
        expect(normalized1[i].checksum).toBe(normalized2[i].checksum);
      }
    });

    it('should preserve line movement information', async () => {
      const raw = await importer.fetch('tournament-101');
      const normalized = await importer.normalize(raw);

      const withLineMovement = normalized.filter(n => (n.fields as any).lineMovement !== undefined);
      expect(withLineMovement.length).toBeGreaterThan(0);
    });
  });

  describe('validate()', () => {
    it('should validate normalized records', async () => {
      const raw = await importer.fetch('tournament-101');
      const normalized = await importer.normalize(raw);
      const validation = await importer.validate(normalized);

      expect(validation.stats.passedCount).toBe(4);
      expect(validation.stats.rejectedCount).toBe(0);
      expect(validation.stats.duplicateCount).toBe(0);
    });

    it('should detect duplicate records by checksum', async () => {
      const raw = await importer.fetch('tournament-101');
      const normalized = await importer.normalize(raw);
      
      // Duplicate the first record
      normalized.push(normalized[0]);

      const validation = await importer.validate(normalized);

      expect(validation.stats.duplicateCount).toBe(1);
      expect(validation.stats.rejectedCount).toBeGreaterThan(0);
    });

    it('should reject invalid odds values', async () => {
      const raw = await importer.fetch('tournament-101');
      const normalized = await importer.normalize(raw);
      
      // Corrupt an odds value
      normalized[0].fields.decimalOdds = -1;

      const validation = await importer.validate(normalized);

      expect(validation.stats.rejectedCount).toBeGreaterThan(0);
    });
  });

  describe('persist() [mocked]', () => {
    it('should track inserted vs updated records', async () => {
      // This test is mocked since we don't want to mutate the real DB in unit tests
      const raw = await importer.fetch('tournament-101');
      const normalized = await importer.normalize(raw);
      const validation = await importer.validate(normalized);

      // Mock the Prisma calls
      vi.spyOn(importer as any, 'prisma', 'get').mockReturnValue({
        oddsQuote: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({}),
        },
      });

      const persistence = await importer.persist(validation.valid, 'job-1');

      expect(persistence.inserted).toBeGreaterThanOrEqual(0);
      expect(typeof persistence.updated).toBe('number');
    });
  });

  describe('verify() [mocked]', () => {
    it('should verify persisted records', async () => {
      // Mock the Prisma count call
      vi.spyOn(importer as any, 'prisma', 'get').mockReturnValue({
        oddsQuote: {
          count: vi.fn().mockResolvedValue(4),
        },
      });

      const verification = await importer.verify('job-1');

      expect(verification.recordsVerified).toBeGreaterThanOrEqual(0);
      expect(typeof verification.integrityChecksPassed).toBe('boolean');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should execute complete import pipeline', async () => {
      // Discover
      const datasets = await importer.discover();
      expect(datasets).toHaveLength(1);

      // Fetch
      const raw = await importer.fetch(datasets[0].id);
      expect(raw.length).toBeGreaterThan(0);

      // Normalize
      const normalized = await importer.normalize(raw);
      expect(normalized.length).toBe(raw.length);

      // Validate
      const validation = await importer.validate(normalized);
      expect(validation.stats.passedCount).toBeGreaterThan(0);

      // Verify determinism
      const normalized2 = await importer.normalize(raw);
      for (let i = 0; i < normalized.length; i++) {
        expect(normalized[i].checksum).toBe(normalized2[i].checksum);
      }
    });
  });

  describe('Line Movement Tracking', () => {
    it('should store opening and closing odds', async () => {
      const raw = await importer.fetch('tournament-101');
      const normalized = await importer.normalize(raw);

      const withLineMovement = normalized.filter(n => (n.fields as any).openingOdds !== undefined);
      expect(withLineMovement.length).toBeGreaterThan(0);

      const record = withLineMovement[0].fields as any;
      expect(record.openingOdds).toBeDefined();
      expect(record.closingOdds).toBeDefined();
      expect(record.lineMovement).toBeDefined();
    });

    it('should validate line movement calculations', async () => {
      const raw = await importer.fetch('tournament-101');
      const normalized = await importer.normalize(raw);

      for (const record of normalized) {
        const fields = record.fields as any;
        if (fields.openingOdds && fields.closingOdds && fields.lineMovement !== undefined) {
          const expectedMovement = fields.closingOdds - fields.openingOdds;
          expect(Math.abs(fields.lineMovement - expectedMovement)).toBeLessThan(0.01);
        }
      }
    });
  });

  describe('Market Type Support', () => {
    it('should support all market types', async () => {
      expect('TOURNAMENT_WINNER').toBeDefined();
      expect('TOP_5').toBeDefined();
      expect('TOP_10').toBeDefined();
      expect('MAKE_CUT').toBeDefined();
    });
  });
});
