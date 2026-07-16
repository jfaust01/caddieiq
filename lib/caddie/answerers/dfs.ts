/**
 * AI Caddie answerers grounded in the DFS Value Engine.
 *
 * Cash plays → the "highest confidence" board (safe, stable value).
 * GPP plays  → the "risky GPP targets" board (ceiling / leverage).
 * Underpriced→ the "value plays" board (cheap salary, strong value).
 *
 * Each reads only the relevant {@link DfsBoard} from the bundle, cites the DFS
 * Value Engine, and degrades honestly when the board is missing or empty.
 */

import type { DfsBoard, DfsBoardKey, DfsValueField } from "@/lib/dfs-value/types"
import type { CaddieAnswer, CaddieIntent } from "../types"
import { emptyAnswer, formatSalary, fromGradedConfidence, playerEntity } from "./shared"

const ENGINE = "DFS Value Engine"

function findBoard(dfs: DfsValueField, key: DfsBoardKey): DfsBoard | null {
  return dfs.boards.find((b) => b.key === key) ?? null
}

interface DfsAnswerSpec {
  readonly intent: CaddieIntent
  readonly boardKey: DfsBoardKey
  readonly headline: string
  readonly emptyReason: string
  readonly followUps: readonly string[]
}

function answerFromBoard(
  dfs: DfsValueField | null,
  tournamentName: string,
  spec: DfsAnswerSpec,
): CaddieAnswer {
  if (!dfs || dfs.ratedPlayers === 0) {
    return emptyAnswer(spec.intent, tournamentName, ENGINE, spec.emptyReason, spec.followUps)
  }

  const board = findBoard(dfs, spec.boardKey)
  if (!board || board.entries.length === 0) {
    return emptyAnswer(spec.intent, tournamentName, ENGINE, spec.emptyReason, spec.followUps)
  }

  const top = board.entries.slice(0, 5)
  const entities = top.map((e) =>
    playerEntity(
      e.playerId,
      e.displayName,
      `${e.tier ?? "—"} · ${formatSalary(e.salary)}`,
    ),
  )
  const bullets = top.map(
    (e) => `${e.rank}. ${e.displayName} (${formatSalary(e.salary)}) — ${e.headline}`,
  )

  return {
    intent: spec.intent,
    headline: spec.headline,
    summary: `${board.description} for ${tournamentName}.`,
    bullets,
    entities,
    citations: [
      {
        engine: ENGINE,
        confidence: fromGradedConfidence(dfs.averageConfidence),
        detail: `${dfs.ratedPlayers} of ${dfs.totalPlayers} players rated`,
      },
    ],
    confidence: fromGradedConfidence(dfs.averageConfidence),
    followUps: spec.followUps,
    isEmpty: false,
  }
}

/** "Best cash plays" → highest-confidence value board. */
export function answerBestCashPlays(dfs: DfsValueField | null, tournamentName: string): CaddieAnswer {
  return answerFromBoard(dfs, tournamentName, {
    intent: "best_cash_plays",
    boardKey: "highestConfidence",
    headline: "Best cash-game plays",
    emptyReason: "DFS value scores aren't imported yet",
    followUps: ["Who's underpriced?", "Best GPP plays?", "Who fits the course?"],
  })
}

/** "Best GPP plays" → risky, high-ceiling targets. */
export function answerBestGppPlays(dfs: DfsValueField | null, tournamentName: string): CaddieAnswer {
  return answerFromBoard(dfs, tournamentName, {
    intent: "best_gpp_plays",
    boardKey: "riskyGppTargets",
    headline: "Best GPP / tournament plays",
    emptyReason: "DFS value scores aren't imported yet",
    followUps: ["Best cash plays?", "Who's underpriced?", "Weather this week?"],
  })
}

/** "Who's underpriced?" → the value-plays board (cheap salary, strong value). */
export function answerUnderpriced(dfs: DfsValueField | null, tournamentName: string): CaddieAnswer {
  return answerFromBoard(dfs, tournamentName, {
    intent: "underpriced",
    boardKey: "valuePlays",
    headline: "Underpriced value plays",
    emptyReason: "DFS salaries and value scores aren't imported yet",
    followUps: ["Best cash plays?", "Best GPP plays?", "Who's in form?"],
  })
}
