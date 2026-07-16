/**
 * AI Caddie answerer grounded in the Player Skill Engine.
 *
 * "Who's in form / hot / best putter?" → a Skill Leaderboard. If the question
 * names a specific skill (irons, putting, driving distance/accuracy,
 * scrambling) we pick that board; otherwise we default to the overall highest
 * confidence leaderboard as a general "playing well" read.
 */

import type { SkillLeaderboard, SkillLeaderboardKey, SkillLeaderboards } from "@/lib/player-skill-intelligence/types"
import type { CaddieAnswer } from "../types"
import { emptyAnswer, formatScore, fromGradedConfidence, playerEntity } from "./shared"

const ENGINE = "Player Skill Engine"

/** Pick a leaderboard from skill keywords in the raw question. */
function pickBoardKey(raw: string): SkillLeaderboardKey {
  const t = raw.toLowerCase()
  if (t.includes("iron")) return "bestIronPlayers"
  if (t.includes("putt")) return "bestPutters"
  if (t.includes("scrambl")) return "bestScramblers"
  if (t.includes("accura")) return "mostAccurateDrivers"
  if (t.includes("long") || t.includes("distance") || t.includes("driv")) return "longestDrivers"
  return "highestConfidence"
}

export function answerTopForm(
  skill: SkillLeaderboards | null,
  tournamentName: string,
  raw: string,
): CaddieAnswer {
  if (!skill || skill.ratedPlayers === 0) {
    return emptyAnswer(
      "top_form",
      tournamentName,
      ENGINE,
      "Player skill ratings aren't imported yet",
      ["Who fits the course?", "Best cash plays?", "Odds favorites?"],
    )
  }

  const key = pickBoardKey(raw)
  const board: SkillLeaderboard | undefined =
    skill.boards.find((b) => b.key === key) ?? skill.boards.find((b) => b.entries.length > 0)

  if (!board || board.entries.length === 0) {
    return emptyAnswer(
      "top_form",
      tournamentName,
      ENGINE,
      "That skill leaderboard isn't available",
      ["Who fits the course?", "Best cash plays?", "Odds favorites?"],
    )
  }

  const top = board.entries.slice(0, 5)
  return {
    intent: "top_form",
    headline: board.title,
    summary: `${board.description} for ${tournamentName}.`,
    bullets: top.map((e) => {
      const raw = e.rawValue != null && e.unit ? ` (${e.rawValue} ${e.unit})` : ""
      return `${e.rank}. ${e.playerName} — ${formatScore(e.value)}${raw}`
    }),
    entities: top.map((e) => playerEntity(e.playerId, e.playerName, formatScore(e.value))),
    citations: [
      {
        engine: ENGINE,
        confidence: fromGradedConfidence(top[0].confidence),
        detail: `${skill.ratedPlayers} of ${skill.totalPlayers} players rated`,
      },
    ],
    confidence: fromGradedConfidence(top[0].confidence),
    followUps: ["Who fits the course?", "Best GPP plays?", "Who's underpriced?"],
    isEmpty: false,
  }
}
