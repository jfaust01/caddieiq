import type { PrismaClient } from '@prisma/client';
import type { NormalizedRecord } from '@/lib/imports/historical-importer';

/**
 * Service for creating complete provenance audit trails for imported historical records
 */
export class ProvenanceAuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create complete provenance audit event for an imported record
   */
  async auditImportedRecord(
    record: NormalizedRecord,
    importJobId: string,
    eventType: 'HISTORICAL_RECORD_IMPORTED' | 'HISTORICAL_RECORD_UPDATED',
    options?: {
      sourceEndpoint?: string;
      sourceVersion?: string;
      previousValue?: string;
    }
  ): Promise<void> {
    try {
      // Store full provenance in newValue as JSON
      const provenance = {
        provider: record.provider,
        providerRecordId: record.providerRecordId,
        providerVersion: record.providerVersion,
        sourceEndpoint: options?.sourceEndpoint,
        sourceVersion: options?.sourceVersion,
        checksum: record.checksum,
        canonicalId: record.canonicalId,
        sourceEffectiveTimestamp: record.sourceEffectiveTimestamp,
        retrievalTimestamp: record.retrievedTimestamp,
        validFrom: record.validFrom,
        validTo: record.validTo,
      };

      await this.prisma.historicalDataAuditEvent.create({
        data: {
          eventType: eventType as any,
          entityType: 'HistoricalRecord',
          entityId: record.canonicalId,
          previousValue: options?.previousValue,
          newValue: JSON.stringify(provenance),
          performedBy: 'import-system',
          performedAt: new Date(),
          // Store provenance fields (if schema is updated)
          providerName: record.provider,
          providerRecordId: record.providerRecordId,
          sourceEndpoint: options?.sourceEndpoint,
          sourceVersion: options?.sourceVersion,
          dataChecksum: record.checksum,
          retrievalTimestamp: record.retrievedTimestamp,
          effectiveTimestamp: record.sourceEffectiveTimestamp,
          importJobId: importJobId,
        },
      });
    } catch (error) {
      // If audit fails but import succeeds, log but don't fail
      console.error('[v0] Provenance audit failed:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Get complete provenance trail for a record
   */
  async getProvenanceTrail(entityId: string): Promise<any[]> {
    return this.prisma.historicalDataAuditEvent.findMany({
      where: {
        entityId,
        eventType: {
          in: ['HISTORICAL_RECORD_IMPORTED', 'HISTORICAL_RECORD_UPDATED'],
        },
      },
      orderBy: {
        performedAt: 'asc',
      },
    });
  }

  /**
   * Get all provenance events for an import job
   */
  async getJobProvenance(importJobId: string): Promise<any[]> {
    return this.prisma.historicalDataAuditEvent.findMany({
      where: {
        importJobId,
      },
      orderBy: {
        performedAt: 'desc',
      },
    });
  }

  /**
   * Get sample of persisted records with full provenance
   */
  async getSampleRecordsWithProvenance(limit: number = 5): Promise<any[]> {
    const events = await this.prisma.historicalDataAuditEvent.findMany({
      where: {
        eventType: {
          in: ['HISTORICAL_RECORD_IMPORTED', 'HISTORICAL_RECORD_UPDATED'],
        },
      },
      orderBy: {
        performedAt: 'desc',
      },
      take: limit,
    });

    return events.map((event) => ({
      entityId: event.entityId,
      provider: (event as any).providerName,
      providerRecordId: (event as any).providerRecordId,
      sourceEndpoint: (event as any).sourceEndpoint,
      checksum: (event as any).dataChecksum,
      importJobId: (event as any).importJobId,
      retrievedAt: (event as any).retrievalTimestamp,
      effectiveAt: (event as any).effectiveTimestamp,
      performedAt: event.performedAt,
      provenance: event.newValue ? JSON.parse(event.newValue) : null,
    }));
  }
}

export { ProvenanceAuditService as default };
