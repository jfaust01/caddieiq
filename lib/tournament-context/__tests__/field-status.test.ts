import { describe, expect, it } from 'vitest'

import { computeFieldReleaseTime, deriveFieldIntelligence } from '../field-status'
import type { FieldIntelligenceInput } from '../field-status'

/* --- helpers ------------------------------------------------------------- */

/** ET calendar/clock parts of an instant, for self-verifying deadline assertions. */
function etParts(date: Date): { weekday: string; hour: number; minute: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    day: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const map: Record<string, string> = {}
  for (const part of parts) map[part.type] = part.value
  return {
    weekday: map.weekday,
    hour: Number(map.hour),
    minute: Number(map.minute),
    day: Number(map.day),
  }
}

/** A fully-specified upcoming SCHEDULED event with no field, as a baseline. */
function baseInput(overrides: Partial<FieldIntelligenceInput> = {}): FieldIntelligenceInput {
  return {
    status: 'SCHEDULED',
    startDate: new Date('2026-09-17T16:00:00Z'), // Thu, noon ET
    endDate: new Date('2026-09-20T22:00:00Z'),
    fieldConfirmed: false,
    fieldPlayerCount: null,
    ...overrides,
  }
}

// A fixed "now" well before the 2026 events so they read as upcoming.
const NOW_2026_SPRING = new Date('2026-03-01T12:00:00Z').getTime()

/* --- computeFieldReleaseTime -------------------------------------------- */

describe('computeFieldReleaseTime', () => {
  it('returns 5:00 PM ET on the Friday before tournament week (EDT case)', () => {
    // Thu Sep 17, 2026 → tournament week Mon Sep 14; the Friday before is Sep 11.
    // September is EDT (UTC-4), so 5:00 PM ET === 21:00 UTC.
    const release = computeFieldReleaseTime(new Date('2026-09-17T16:00:00Z'))
    expect(release.toISOString()).toBe('2026-09-11T21:00:00.000Z')

    const et = etParts(release)
    expect(et.weekday).toBe('Fri')
    expect(et.hour).toBe(17)
    expect(et.minute).toBe(0)
  })

  it('lands on 5:00 PM ET Friday in winter too (EST case, offset differs)', () => {
    // A January event — EST (UTC-5), so 5:00 PM ET === 22:00 UTC. Rather than
    // hand-compute the date, assert the invariant properties hold.
    const release = computeFieldReleaseTime(new Date('2026-01-15T17:00:00Z')) // Thu, noon ET
    const et = etParts(release)
    expect(et.weekday).toBe('Fri')
    expect(et.hour).toBe(17)
    expect(et.minute).toBe(0)
    // EST offset → 22:00 UTC, proving the DST correction is applied, not hard-coded.
    expect(release.toISOString().endsWith('T22:00:00.000Z')).toBe(true)
    expect(release.getTime()).toBeLessThan(new Date('2026-01-15T17:00:00Z').getTime())
  })

  it('is always a Friday strictly before the start date', () => {
    for (const iso of [
      '2026-06-01T16:00:00Z', // Mon
      '2026-06-04T16:00:00Z', // Thu
      '2026-06-07T16:00:00Z', // Sun
      '2026-11-12T17:00:00Z', // Thu (from the seeded data)
    ]) {
      const start = new Date(iso)
      const release = computeFieldReleaseTime(start)
      expect(etParts(release).weekday).toBe('Fri')
      expect(etParts(release).hour).toBe(17)
      expect(release.getTime()).toBeLessThan(start.getTime())
      // Never more than ~11 days before the start (prior-week Friday at most).
      const daysBefore = (start.getTime() - release.getTime()) / 86_400_000
      expect(daysBefore).toBeGreaterThan(0)
      expect(daysBefore).toBeLessThan(12)
    }
  })

  it('is deterministic — identical input yields identical output', () => {
    const a = computeFieldReleaseTime(new Date('2026-09-17T16:00:00Z'))
    const b = computeFieldReleaseTime(new Date('2026-09-17T16:00:00Z'))
    expect(a.toISOString()).toBe(b.toISOString())
  })
})

/* --- deriveFieldIntelligence: lifecycle --------------------------------- */

describe('deriveFieldIntelligence — lifecycle', () => {
  it('marks a known upcoming event with no field as awaiting (not an error)', () => {
    const out = deriveFieldIntelligence(baseInput(), NOW_2026_SPRING)
    expect(out.fieldStatus).toBe('awaiting')
    expect(out.fieldConfidence).toBe('awaiting')
    expect(out.fieldConfirmed).toBe(false)
    expect(out.fieldReleaseTime).toBe('2026-09-11T21:00:00.000Z')
    expect(out.fieldPlayerCount).toBeNull()
  })

  it('marks an upcoming event with an imported field as confirmed/official', () => {
    const out = deriveFieldIntelligence(
      baseInput({ fieldConfirmed: true, fieldPlayerCount: 42 }),
      NOW_2026_SPRING,
    )
    expect(out.fieldStatus).toBe('confirmed')
    expect(out.fieldConfidence).toBe('official')
    expect(out.fieldPlayerCount).toBe(42)
  })

  it('treats an ACTIVE event as live', () => {
    const out = deriveFieldIntelligence(
      baseInput({ status: 'ACTIVE', fieldConfirmed: true, fieldPlayerCount: 120 }),
      NOW_2026_SPRING,
    )
    expect(out.fieldStatus).toBe('live')
    expect(out.fieldConfidence).toBe('official')
  })

  it('treats an event whose window currently contains now as live', () => {
    const now = new Date('2026-09-18T12:00:00Z').getTime() // between start and end
    const out = deriveFieldIntelligence(baseInput({ fieldConfirmed: true }), now)
    expect(out.fieldStatus).toBe('live')
  })

  it('treats an event whose end date has passed as complete', () => {
    const now = new Date('2026-10-01T12:00:00Z').getTime() // after end
    const out = deriveFieldIntelligence(baseInput({ fieldConfirmed: true, fieldPlayerCount: 78 }), now)
    expect(out.fieldStatus).toBe('complete')
    expect(out.fieldConfidence).toBe('official')
  })

  it('reports complete with unknown confidence when no field was ever imported', () => {
    const out = deriveFieldIntelligence(baseInput({ status: 'COMPLETED' }), NOW_2026_SPRING)
    expect(out.fieldStatus).toBe('complete')
    expect(out.fieldConfidence).toBe('unknown')
  })

  it('marks a CANCELED event as cancelled regardless of dates or field', () => {
    const out = deriveFieldIntelligence(
      baseInput({ status: 'CANCELED', fieldConfirmed: true, fieldPlayerCount: 50 }),
      NOW_2026_SPRING,
    )
    expect(out.fieldStatus).toBe('cancelled')
    expect(out.fieldConfidence).toBe('unknown')
  })

  it('returns unknown when there is neither a date nor a field (never guesses)', () => {
    const out = deriveFieldIntelligence(
      baseInput({ startDate: null, endDate: null }),
      NOW_2026_SPRING,
    )
    expect(out.fieldStatus).toBe('unknown')
    expect(out.fieldConfidence).toBe('unknown')
    expect(out.fieldReleaseTime).toBeNull()
    expect(out.fieldPlayerCount).toBeNull()
  })
})

/* --- deriveFieldIntelligence: honesty guards ---------------------------- */

describe('deriveFieldIntelligence — honesty guards', () => {
  it('never surfaces a player count until the field is actually confirmed', () => {
    // A count present in the input but no confirmed field → must stay null.
    const out = deriveFieldIntelligence(
      baseInput({ fieldConfirmed: false, fieldPlayerCount: 99 }),
      NOW_2026_SPRING,
    )
    expect(out.fieldPlayerCount).toBeNull()
  })

  it('null release time propagates honestly when the start date is unknown', () => {
    const out = deriveFieldIntelligence(
      baseInput({ startDate: null, status: 'SCHEDULED' }),
      NOW_2026_SPRING,
    )
    expect(out.fieldReleaseTime).toBeNull()
  })

  it('is total and deterministic across a matrix of inputs (never throws)', () => {
    const statuses = ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELED', 'WEIRD']
    for (const status of statuses) {
      for (const fieldConfirmed of [true, false]) {
        for (const startDate of [null, new Date('2026-09-17T16:00:00Z')]) {
          const input = baseInput({ status, fieldConfirmed, startDate })
          const a = deriveFieldIntelligence(input, NOW_2026_SPRING)
          const b = deriveFieldIntelligence(input, NOW_2026_SPRING)
          expect(a).toEqual(b)
          expect(a.fieldStatus).toBeTypeOf('string')
          expect(a.fieldConfidence).toBeTypeOf('string')
        }
      }
    }
  })
})
