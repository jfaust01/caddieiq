import { describe, expect, it } from 'vitest'

import { normalizeTournamentContext, type RawTournamentContext } from '../context'

const DAY = 24 * 60 * 60 * 1000

function baseTournament(overrides: Partial<RawTournamentContext['tournament']> = {}) {
  return {
    id: 't1',
    name: 'The Verified Open',
    slug: 'the-verified-open',
    status: 'SCHEDULED',
    startDate: new Date(Date.now() + 7 * DAY),
    endDate: new Date(Date.now() + 10 * DAY),
    ...overrides,
  }
}

function raw(overrides: Partial<RawTournamentContext> = {}): RawTournamentContext {
  return {
    source: 'player',
    tournament: baseTournament(),
    course: { id: 'c1', name: 'Verified National' },
    fieldConfirmed: true,
    ...overrides,
  }
}

describe('normalizeTournamentContext', () => {
  it('returns a verified context when tournament, course, and start date exist', () => {
    const context = normalizeTournamentContext(raw())

    expect(context.status).toBe('available')
    if (context.status !== 'available') return
    expect(context.confidence).toBe('verified')
    expect(context.course).toEqual({ id: 'c1', name: 'Verified National' })
    expect(context.timing).toBe('UPCOMING')
    expect(context.gaps).toHaveLength(0)
    expect(context.tournament.startDate).toEqual(expect.any(String))
  })

  it('degrades to partial (not unavailable) when no host course is linked', () => {
    const context = normalizeTournamentContext(raw({ course: null }))

    expect(context.status).toBe('available')
    if (context.status !== 'available') return
    expect(context.confidence).toBe('partial')
    expect(context.course).toBeNull()
    expect(context.gaps.map((gap) => gap.field)).toContain('course')
  })

  it('degrades to partial when the start date is unknown', () => {
    const context = normalizeTournamentContext(
      raw({ tournament: baseTournament({ startDate: null }) }),
    )

    expect(context.status).toBe('available')
    if (context.status !== 'available') return
    expect(context.confidence).toBe('partial')
    expect(context.gaps.map((gap) => gap.field)).toContain('startDate')
  })

  it('records a field gap but stays verified when course and dates are present', () => {
    const context = normalizeTournamentContext(raw({ fieldConfirmed: false }))

    expect(context.status).toBe('available')
    if (context.status !== 'available') return
    expect(context.confidence).toBe('verified')
    expect(context.fieldConfirmed).toBe(false)
    expect(context.gaps.map((gap) => gap.field)).toContain('field')
  })

  it('returns an unavailable context with a player reason when there is no tournament', () => {
    const context = normalizeTournamentContext(raw({ source: 'player', tournament: null }))

    expect(context.status).toBe('unavailable')
    if (context.status !== 'unavailable') return
    expect(context.confidence).toBe('unavailable')
    expect(context.reason).toBe('no-upcoming-tournament')
    expect(context.detail).toMatch(/no verified upcoming tournament/i)
  })

  it('returns an unavailable context with a tournament reason for a missing tournament id', () => {
    const context = normalizeTournamentContext(raw({ source: 'tournament', tournament: null }))

    expect(context.status).toBe('unavailable')
    if (context.status !== 'unavailable') return
    expect(context.reason).toBe('tournament-missing')
  })

  it('derives LIVE timing when the event has started but not ended', () => {
    const context = normalizeTournamentContext(
      raw({
        tournament: baseTournament({
          startDate: new Date(Date.now() - 1 * DAY),
          endDate: new Date(Date.now() + 2 * DAY),
        }),
      }),
    )

    expect(context.status).toBe('available')
    if (context.status !== 'available') return
    expect(context.timing).toBe('LIVE')
  })

  it('derives COMPLETED timing when the event has ended', () => {
    const context = normalizeTournamentContext(
      raw({
        tournament: baseTournament({
          startDate: new Date(Date.now() - 10 * DAY),
          endDate: new Date(Date.now() - 3 * DAY),
        }),
      }),
    )

    expect(context.status).toBe('available')
    if (context.status !== 'available') return
    expect(context.timing).toBe('COMPLETED')
  })
})
