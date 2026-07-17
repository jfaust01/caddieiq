/**
 * Round domain types.
 *
 * A Round represents a single day of competition at a tournament. Created from
 * leaderboard imports, one round per tournament (leaderboard data provides no
 * round-level breakdown). Status and completion are derived from the tournament's
 * overall status and historical data import context.
 */

import type { RoundStatus } from "@/lib/generated/prisma/client"

/** A tournament round, persisted from historical leaderboard imports. */
export interface Round {
  /** CaddieIQ-generated unique id. */
  id: string
  /** Resolved tournament id (FK). */
  tournamentId: string
  /** Round sequence number (1-based). */
  roundNumber: number
  /** ISO date the round was/will be played. */
  scheduledDate: Date | null
  /** Current status (SCHEDULED, IN_PROGRESS, COMPLETED). */
  status: RoundStatus
  /** Round is finished (actual or historical). */
  completed: boolean
  /** Timestamp of creation. */
  createdAt: Date
  /** Timestamp of last update. */
  updatedAt: Date
}

/** A player's score and result for a single round. */
export interface PlayerRound {
  /** CaddieIQ-generated unique id. */
  id: string
  /** Resolved round id (FK). */
  roundId: string
  /** Resolved tournament field entry id (FK). */
  tournamentFieldId: string
  /** Total strokes for the round. */
  score: number | null
  /** Strokes relative to par (negative = under par). */
  toPar: number | null
  /** Finishing position (1 = best). */
  position: number | null
  /** Whether the player made the cut. */
  madeCut: boolean | null
  /** Player withdrew from the event. */
  withdrawn: boolean
  /** Player was disqualified. */
  disqualified: boolean
  /** Tee time for the round. */
  teeTime: Date | null
  /** When play started. */
  startedAt: Date | null
  /** When play finished. */
  finishedAt: Date | null
  /** Timestamp of creation. */
  createdAt: Date
  /** Timestamp of last update. */
  updatedAt: Date
}
