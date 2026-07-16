import "server-only"

import { prisma } from "@/lib/prisma"
import {
  getFantasyRepository,
  getImportRunRepository,
  getOddsRepository,
  getPlayerSkillRepository,
} from "@/lib/repositories"
import { getTournamentRepository } from "@/lib/repositories/tournament-repository"
import { SOURCEABLE_SKILL_KEYS } from "@/lib/player-skill-intelligence"
import { deriveFieldIntelligence } from "@/lib/tournament-context"

import { coveragePercent, countPresent, rateCoverage } from "./ratings"
import type {
  CoverageSection,
  DataCoverageReport,
  DomainSummary,
  FieldIntelligenceReport,
  FieldIntelligenceReportRow,
  HealthCheck,
  ImportRunHealth,
  PlatformHealth,
} from "./types"

/**
 * Data Coverage service — the server-only aggregation half of the internal
 * diagnostics dashboard. It reads (never writes) the normalized data model and
 * turns raw counts into an honest, provider-aware coverage report.
 *
 * Honesty is enforced here, not in the UI:
 *   - Only genuinely verified rows count toward coverage numerators.
 *   - Trial-tier scrambled feeds (betting odds, fantasy projections) are marked
 *     `restricted` rather than reported as low coverage — a limitation is not a
 *     failure, and a scrambled value is never surfaced as if real.
 *   - `worldRanking` is known to scramble on the trial tier, so the player
 *     section carries an explicit caveat instead of implying rank precision.
 */

/** Nullable analytic attributes that constitute a course "intelligence" profile. */
const COURSE_PROFILE_ATTRIBUTES = [
  "style",
  "fairwayGrass",
  "greenGrass",
  "roughGrass",
  "averageGreenSize",
  "greenSpeed",
  "fairwayWidth",
  "roughLength",
  "treeLined",
  "waterHazards",
  "windExposure",
  "elevationChange",
  "walkingDifficulty",
  "drivingImportance",
  "approachImportance",
  "shortGameImportance",
  "puttingImportance",
  "scramblingDifficulty",
  "birdieRate",
  "bogeyRate",
  "varianceRating",
] as const

/** A profile is "verified" once at least this many attributes are populated. */
const PROFILE_VERIFIED_MIN = 16
/** A weather snapshot is "fresh" (verified) within this many hours of capture. */
const WEATHER_FRESH_HOURS = 24

const numberFormatter = new Intl.NumberFormat("en-US")

function formatCount(value: number): string {
  return numberFormatter.format(value)
}

function formatPercent(percent: number | null): string {
  return percent === null ? "—" : `${percent}%`
}

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "Never"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatRelativeAge(date: Date | null | undefined, now: number): string {
  if (!date) return "Never"
  const deltaMs = now - date.getTime()
  if (deltaMs < 0) return "Just now"
  const minutes = Math.floor(deltaMs / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null
}

/**
 * Builds the full coverage report. Every query is scoped to non-soft-deleted
 * rows where the model supports it, and all independent reads run in parallel.
 */
export async function getDataCoverageReport(): Promise<DataCoverageReport> {
  const now = Date.now()

  const [
    // Players
    totalPlayers,
    activePlayers,
    playersWithPhoto,
    playersWithNationality,
    rankedPlayerRows,
    tourMembershipRows,
    // Courses / geolocation
    totalCourses,
    verifiedCoords,
    estimatedCoords,
    coordAgg,
    // Course intelligence
    profileRows,
    // Tournaments / weather
    totalTournaments,
    tournamentVenueRows,
    weatherSnapshots,
    // News
    totalArticles,
    playerLinkedArticles,
    newsAgg,
    playersWithNewsRows,
    // Fantasy
    dfsTotal,
    dfsReal,
    fantasyProjTotal,
    fantasyProjAvailable,
    seasonStatRows,
    // Betting (real Odds Intelligence coverage)
    oddsCoverage,
    // Player Skill (fifth Signal Family — real strokes-gained coverage)
    skillCoverage,
    // DFS Value Model (flagship composite — real DraftKings salary readiness)
    dfsSalaryCoverage,
  ] = await Promise.all([
    prisma.player.count({ where: { deletedAt: null } }),
    prisma.player.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.player.count({ where: { deletedAt: null, headshotUrl: { not: null } } }),
    prisma.player.count({ where: { deletedAt: null, nationalityId: { not: null } } }),
    prisma.playerSeasonStatistic.findMany({
      where: { worldRanking: { not: null } },
      distinct: ["playerId"],
      select: { playerId: true },
    }),
    prisma.playerTourHistory.findMany({
      where: { active: true },
      distinct: ["playerId"],
      select: { playerId: true },
    }),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.course.count({ where: { deletedAt: null, coordinateConfidence: "VERIFIED" } }),
    prisma.course.count({ where: { deletedAt: null, coordinateConfidence: "ESTIMATED" } }),
    prisma.course.aggregate({ _max: { coordinatesVerifiedAt: true } }),
    prisma.courseCharacteristic.findMany({
      where: { course: { deletedAt: null } },
      select: Object.fromEntries(
        COURSE_PROFILE_ATTRIBUTES.map((attr) => [attr, true]),
      ) as Record<(typeof COURSE_PROFILE_ATTRIBUTES)[number], true>,
    }),
    prisma.tournament.count({ where: { deletedAt: null } }),
    prisma.tournamentCourse.findMany({
      where: { hostCourse: true },
      distinct: ["tournamentId"],
      select: { tournamentId: true },
    }),
    prisma.weatherSnapshot.findMany({
      select: { capturedAt: true, periodCount: true },
    }),
    prisma.newsArticle.count(),
    prisma.newsArticle.count({ where: { playerId: { not: null } } }),
    prisma.newsArticle.aggregate({ _max: { publishedAt: true, updatedAt: true } }),
    prisma.newsArticle.findMany({
      where: { playerId: { not: null } },
      distinct: ["playerId"],
      select: { playerId: true },
    }),
    prisma.dfsSalary.count(),
    prisma.dfsSalary.count({ where: { salary: { not: null } } }),
    prisma.fantasyProjection.count(),
    prisma.fantasyProjection.count({ where: { available: true } }),
    prisma.playerSeasonStatistic.count({ where: { averagePoints: { not: null } } }),
    getOddsRepository().getCoverageCounts(),
    getPlayerSkillRepository().getCoverageCounts(),
    getFantasyRepository().getSalaryCoverageCounts(),
  ])

  const sections: CoverageSection[] = []

  // --- Course Geolocation ---------------------------------------------------
  const unknownCoords = Math.max(totalCourses - verifiedCoords - estimatedCoords, 0)
  const geoPercent = coveragePercent(verifiedCoords, totalCourses)
  sections.push({
    id: "course-geolocation",
    title: "Course Geolocation",
    description:
      "Verified latitude/longitude per course. Only coordinates confirmed against a real golf-course feature count — clubhouse POIs and locality centroids are rejected.",
    percent: geoPercent,
    rating: rateCoverage(geoPercent),
    breakdown: {
      verified: verifiedCoords,
      pending: estimatedCoords,
      missing: unknownCoords,
      total: totalCourses,
    },
    lastUpdated: toIso(coordAgg._max.coordinatesVerifiedAt),
    metrics: [
      { id: "total", label: "Total Courses", value: formatCount(totalCourses), count: totalCourses },
      {
        id: "verified",
        label: "Verified Coordinates",
        value: formatCount(verifiedCoords),
        count: verifiedCoords,
        percent: geoPercent,
      },
      {
        id: "missing",
        label: "Missing Coordinates",
        value: formatCount(unknownCoords),
        count: unknownCoords,
        hint: "Courses still UNKNOWN — never approximated.",
      },
      { id: "coverage", label: "Coverage %", value: formatPercent(geoPercent), percent: geoPercent },
      {
        id: "last-updated",
        label: "Last Verified",
        value: formatDateTime(coordAgg._max.coordinatesVerifiedAt),
      },
    ],
  })

  // --- Course Intelligence --------------------------------------------------
  const profilePresentCounts = profileRows.map((row) =>
    countPresent(COURSE_PROFILE_ATTRIBUTES.map((attr) => (row as Record<string, unknown>)[attr])),
  )
  const verifiedProfiles = profilePresentCounts.filter((c) => c >= PROFILE_VERIFIED_MIN).length
  const partialProfiles = profilePresentCounts.filter((c) => c > 0 && c < PROFILE_VERIFIED_MIN).length
  const emptyProfiles = profilePresentCounts.filter((c) => c === 0).length
  const unknownProfiles = Math.max(totalCourses - profileRows.length, 0) + emptyProfiles
  const avgAttributes =
    profilePresentCounts.length > 0
      ? profilePresentCounts.reduce((a, b) => a + b, 0) / profilePresentCounts.length
      : 0
  const ciPercent = coveragePercent(verifiedProfiles, totalCourses)
  sections.push({
    id: "course-intelligence",
    title: "Course Intelligence",
    description: `Depth of the course-fit profile. A profile is verified once ${PROFILE_VERIFIED_MIN} of ${COURSE_PROFILE_ATTRIBUTES.length} analytic attributes are populated.`,
    percent: ciPercent,
    rating: rateCoverage(ciPercent),
    breakdown: {
      verified: verifiedProfiles,
      pending: partialProfiles,
      missing: unknownProfiles,
      total: totalCourses,
    },
    metrics: [
      { id: "total", label: "Total Courses", value: formatCount(totalCourses), count: totalCourses },
      {
        id: "verified",
        label: "Verified Profiles",
        value: formatCount(verifiedProfiles),
        count: verifiedProfiles,
        percent: ciPercent,
      },
      { id: "partial", label: "Partial Profiles", value: formatCount(partialProfiles), count: partialProfiles },
      { id: "unknown", label: "Unknown Profiles", value: formatCount(unknownProfiles), count: unknownProfiles },
      {
        id: "avg-attributes",
        label: "Avg Verified Attributes",
        value: `${avgAttributes.toFixed(1)} / ${COURSE_PROFILE_ATTRIBUTES.length}`,
        hint: "Mean populated attributes across courses that have a profile.",
      },
      { id: "coverage", label: "Coverage %", value: formatPercent(ciPercent), percent: ciPercent },
    ],
  })

  // --- Weather --------------------------------------------------------------
  const forecastAvailable = weatherSnapshots.length
  const forecastMissing = Math.max(totalTournaments - forecastAvailable, 0)
  const freshSnapshots = weatherSnapshots.filter(
    (s) => now - s.capturedAt.getTime() <= WEATHER_FRESH_HOURS * 3_600_000,
  ).length
  const staleSnapshots = forecastAvailable - freshSnapshots
  const weatherPercent = coveragePercent(forecastAvailable, totalTournaments)
  const avgFreshnessMs =
    forecastAvailable > 0
      ? weatherSnapshots.reduce((acc, s) => acc + (now - s.capturedAt.getTime()), 0) / forecastAvailable
      : 0
  const avgFreshnessDate = forecastAvailable > 0 ? new Date(now - avgFreshnessMs) : null
  const weatherKeyConfigured = Boolean(process.env.OPENWEATHER_API_KEY)
  sections.push({
    id: "weather",
    title: "Weather",
    description:
      "Per-tournament forecast coverage. Forecasts are only fetched for events with a VERIFIED host-course coordinate; missing includes events with no verified venue or outside the forecast horizon.",
    percent: weatherPercent,
    rating: rateCoverage(weatherPercent),
    breakdown: {
      verified: freshSnapshots,
      pending: staleSnapshots,
      missing: forecastMissing,
      total: totalTournaments,
    },
    lastUpdated: toIso(weatherSnapshots.length ? new Date(Math.max(...weatherSnapshots.map((s) => s.capturedAt.getTime()))) : null),
    note: weatherKeyConfigured
      ? undefined
      : "OPENWEATHER_API_KEY is not configured — no new forecasts can be fetched until it is set.",
    metrics: [
      { id: "total", label: "Total Tournaments", value: formatCount(totalTournaments), count: totalTournaments },
      {
        id: "available",
        label: "Forecast Available",
        value: formatCount(forecastAvailable),
        count: forecastAvailable,
        percent: weatherPercent,
      },
      { id: "missing", label: "Forecast Missing", value: formatCount(forecastMissing), count: forecastMissing },
      { id: "coverage", label: "Weather Coverage %", value: formatPercent(weatherPercent), percent: weatherPercent },
      {
        id: "cache-age",
        label: "Weather Cache Age",
        value: formatRelativeAge(
          weatherSnapshots.length
            ? new Date(Math.max(...weatherSnapshots.map((s) => s.capturedAt.getTime())))
            : null,
          now,
        ),
        hint: "Age of the most recent captured forecast.",
      },
      {
        id: "avg-freshness",
        label: "Avg Forecast Freshness",
        value: formatRelativeAge(avgFreshnessDate, now),
        hint: "Mean capture age across all stored forecasts.",
      },
    ],
  })

  // --- Player Data ----------------------------------------------------------
  const rankedPlayers = rankedPlayerRows.length
  const tourMembers = tourMembershipRows.length
  const photoPercent = coveragePercent(playersWithPhoto, totalPlayers)
  const nationalityPercent = coveragePercent(playersWithNationality, totalPlayers)
  const rankingPercent = coveragePercent(rankedPlayers, totalPlayers)
  const tourPercent = coveragePercent(tourMembers, totalPlayers)
  // A player is "verified" when core identity (photo + nationality + ranking) is
  // all present; "missing" when none is; "pending" otherwise.
  const rankedIds = rankedPlayerRows.map((r) => r.playerId)
  const [fullyEnriched, noneEnriched] = await Promise.all([
    prisma.player.count({
      where: {
        deletedAt: null,
        headshotUrl: { not: null },
        nationalityId: { not: null },
        id: { in: rankedIds },
      },
    }),
    prisma.player.count({
      where: {
        deletedAt: null,
        headshotUrl: null,
        nationalityId: null,
        id: { notIn: rankedIds.length ? rankedIds : ["__none__"] },
      },
    }),
  ])
  const pendingPlayers = Math.max(totalPlayers - fullyEnriched - noneEnriched, 0)
  const playerPercent = coveragePercent(fullyEnriched, totalPlayers)
  sections.push({
    id: "player-data",
    title: "Player Data",
    description:
      "Enrichment depth of the player universe. Verified players carry a headshot, nationality, and a world ranking; images and rankings are also summarized as their own domains.",
    percent: playerPercent,
    rating: rateCoverage(playerPercent),
    breakdown: {
      verified: fullyEnriched,
      pending: pendingPlayers,
      missing: noneEnriched,
      total: totalPlayers,
    },
    note: "World rankings read from the trial-tier SportsDataIO feed are known to scramble (ties, #1 = 0); counts reflect players with any stored ranking and should be treated as indicative, not authoritative.",
    metrics: [
      { id: "imported", label: "Players Imported", value: formatCount(totalPlayers), count: totalPlayers },
      {
        id: "active",
        label: "Active Players",
        value: formatCount(activePlayers),
        count: activePlayers,
        percent: coveragePercent(activePlayers, totalPlayers),
      },
      {
        id: "rankings",
        label: "World Rankings",
        value: formatCount(rankedPlayers),
        count: rankedPlayers,
        percent: rankingPercent,
      },
      { id: "photos", label: "Photos", value: formatCount(playersWithPhoto), count: playersWithPhoto, percent: photoPercent },
      {
        id: "nationality",
        label: "Nationality",
        value: formatCount(playersWithNationality),
        count: playersWithNationality,
        percent: nationalityPercent,
      },
      {
        id: "tour",
        label: "Tour Membership",
        value: formatCount(tourMembers),
        count: tourMembers,
        percent: tourPercent,
      },
      { id: "coverage", label: "Coverage %", value: formatPercent(playerPercent), percent: playerPercent },
    ],
  })

  // --- News -----------------------------------------------------------------
  const playersWithNews = playersWithNewsRows.length
  const unlinkedArticles = Math.max(totalArticles - playerLinkedArticles, 0)
  const newsPercent = coveragePercent(playerLinkedArticles, totalArticles)
  sections.push({
    id: "news",
    title: "News",
    description:
      "Editorial coverage. Articles resolve to a player via the provider's numeric id; tournament-level association is not modeled in the schema, so unlinked articles are reported as general news.",
    percent: newsPercent,
    rating: rateCoverage(newsPercent),
    breakdown: {
      verified: playerLinkedArticles,
      pending: 0,
      missing: unlinkedArticles,
      total: totalArticles,
    },
    lastUpdated: toIso(newsAgg._max.publishedAt ?? newsAgg._max.updatedAt),
    metrics: [
      { id: "articles", label: "Recent Articles", value: formatCount(totalArticles), count: totalArticles },
      {
        id: "players-with-news",
        label: "Players With News",
        value: formatCount(playersWithNews),
        count: playersWithNews,
        percent: coveragePercent(playersWithNews, totalPlayers),
      },
      {
        id: "general",
        label: "General / Unlinked",
        value: formatCount(unlinkedArticles),
        count: unlinkedArticles,
        hint: "Tournament-wide or unresolved articles (tournament linkage not modeled).",
      },
      { id: "coverage", label: "Player-Linked Coverage", value: formatPercent(newsPercent), percent: newsPercent },
    ],
  })

  // --- Fantasy --------------------------------------------------------------
  // DFS salaries are REAL on the trial tier; projections are scrambled/404.
  const projectionsRestricted = fantasyProjAvailable === 0
  const fantasyHasRealData = dfsReal > 0
  const fantasyPercent = fantasyHasRealData ? coveragePercent(dfsReal, dfsTotal || dfsReal) : null
  sections.push({
    id: "fantasy",
    title: "Fantasy",
    description:
      "DFS salaries are real whenever an event is slated; per-tournament projection points are scrambled on the trial tier and are never surfaced as real.",
    percent: fantasyPercent,
    rating: fantasyHasRealData ? rateCoverage(fantasyPercent) : "restricted",
    breakdown: {
      verified: dfsReal + fantasyProjAvailable,
      pending: 0,
      missing: (dfsTotal - dfsReal) + (fantasyProjTotal - fantasyProjAvailable),
      total: dfsTotal + fantasyProjTotal,
    },
    restrictedReason:
      !fantasyHasRealData && projectionsRestricted
        ? "Provider Restricted — no real fantasy data on the trial tier. DFS salaries populate for slated events; projection points remain scrambled."
        : undefined,
    metrics: [
      {
        id: "dfs-salaries",
        label: "DFS Salaries",
        value: dfsReal > 0 ? formatCount(dfsReal) : "None slated",
        count: dfsReal,
        hint: "Real DraftKings/FanDuel salaries for slated events.",
      },
      {
        id: "fantasy-stats",
        label: "Fantasy Statistics",
        value: formatCount(seasonStatRows),
        count: seasonStatRows,
        hint: "Season points rows (OWGR-derived per the data catalog — labeled, not DFS scoring).",
      },
      {
        id: "projections",
        label: "Projection Inputs",
        value: projectionsRestricted ? "Provider Restricted" : formatCount(fantasyProjAvailable),
        count: fantasyProjAvailable,
        hint: "Per-tournament projections; scrambled/404 on the trial tier.",
      },
    ],
  })

  // --- Betting --------------------------------------------------------------
  // Real bookmaker prices from the Odds Intelligence pipeline (The Odds API).
  // The meaningful coverage ratio is how many captured odds events are linked to
  // a CaddieIQ tournament — only linked events surface on a tournament hub. When
  // no odds have been captured yet the section is empty (never fabricated).
  const {
    events: oddsEvents,
    eventsLinkedToTournament: oddsEventsLinked,
    quotes: oddsQuotes,
    quotesResolvedToPlayer: oddsQuotesResolved,
    distinctBookmakers: oddsBookmakers,
    latestCapturedAt: oddsLatest,
  } = oddsCoverage
  const bettingEmpty = oddsEvents === 0
  const bettingUnlinked = Math.max(oddsEvents - oddsEventsLinked, 0)
  const bettingPercent = bettingEmpty ? null : coveragePercent(oddsEventsLinked, oddsEvents)
  const playerResolvePercent = oddsQuotes === 0 ? null : coveragePercent(oddsQuotesResolved, oddsQuotes)
  sections.push({
    id: "betting",
    title: "Betting",
    description:
      "De-vigged, multi-sportsbook consensus for the outright winner market. Prices are real bookmaker quotes from The Odds API; coverage tracks how many captured events are linked to a CaddieIQ tournament and how many quotes resolve to a known player.",
    percent: bettingPercent,
    rating: bettingEmpty ? "restricted" : rateCoverage(bettingPercent),
    breakdown: {
      verified: oddsEventsLinked,
      pending: bettingUnlinked,
      missing: 0,
      total: oddsEvents,
    },
    lastUpdated: toIso(oddsLatest),
    restrictedReason: bettingEmpty
      ? "No odds captured yet — run the odds import to populate real bookmaker prices. Nothing here is estimated."
      : undefined,
    metrics: [
      {
        id: "events",
        label: "Events Captured",
        value: formatCount(oddsEvents),
        count: oddsEvents,
        hint: "Distinct odds events with at least one real bookmaker quote.",
      },
      {
        id: "linked",
        label: "Linked to Tournament",
        value: formatCount(oddsEventsLinked),
        count: oddsEventsLinked,
        percent: bettingPercent,
        hint: "Events resolved to a CaddieIQ tournament — only these surface on a tournament hub.",
      },
      {
        id: "quotes",
        label: "Bookmaker Quotes",
        value: formatCount(oddsQuotes),
        count: oddsQuotes,
        hint: "Individual real price quotes across all books and selections.",
      },
      {
        id: "resolved",
        label: "Resolved to Player",
        value: playerResolvePercent === null ? "—" : `${formatCount(oddsQuotesResolved)}`,
        count: oddsQuotesResolved,
        percent: playerResolvePercent,
        hint: "Quotes matched to a known CaddieIQ player (drives the player market card).",
      },
      {
        id: "sportsbooks",
        label: "Sportsbooks",
        value: oddsBookmakers > 0 ? formatCount(oddsBookmakers) : "None",
        count: oddsBookmakers,
        hint: "Distinct bookmakers contributing to consensus.",
      },
      {
        id: "coverage",
        label: "Linked Coverage",
        value: bettingEmpty ? "No data" : formatPercent(bettingPercent),
        percent: bettingPercent,
      },
    ],
  })

  // --- Player Skill (fifth Signal Family) ----------------------------------
  // Coverage tracks how much VERIFIED strokes-gained/round-statistic data backs
  // the skill engine. "Verified" here means a round carrying at least one
  // strokes-gained value (the signal skill ratings normalize against); rows with
  // only counting stats are "pending". When the source table is empty (e.g. SG
  // is not entitled on the current provider tier) the section reads as restricted
  // rather than as a failure — a limitation is not a low score, and no rating is
  // ever fabricated.
  const skillEmpty = skillCoverage.roundStatistics === 0
  const skillNoSg = !skillEmpty && skillCoverage.roundsWithStrokesGained === 0
  const skillPendingRounds = Math.max(
    skillCoverage.roundStatistics - skillCoverage.roundsWithStrokesGained,
    0,
  )
  const skillPercent = skillEmpty
    ? null
    : coveragePercent(skillCoverage.roundsWithStrokesGained, skillCoverage.roundStatistics)
  const skillRestricted = skillEmpty || skillNoSg
  sections.push({
    id: "player-skill",
    title: "Player Skill",
    description: `Normalized golf-skill signals (${SOURCEABLE_SKILL_KEYS.length} sourceable skills) built from verified round statistics. Coverage tracks rounds carrying at least one strokes-gained value — the signal ratings are ranked against — never estimated.`,
    percent: skillPercent,
    rating: skillRestricted ? "restricted" : rateCoverage(skillPercent),
    breakdown: {
      verified: skillCoverage.roundsWithStrokesGained,
      pending: skillPendingRounds,
      missing: 0,
      total: skillCoverage.roundStatistics,
    },
    lastUpdated: toIso(skillCoverage.latestRoundAt),
    restrictedReason: skillEmpty
      ? "No round statistics captured yet — skill ratings populate automatically once strokes-gained data is ingested. Nothing here is estimated."
      : skillNoSg
        ? "Round statistics are held, but none carry strokes-gained values (not entitled on the current provider tier), so skills cannot be rated yet."
        : undefined,
    metrics: [
      {
        id: "players",
        label: "Players With Samples",
        value: formatCount(skillCoverage.playersWithSamples),
        count: skillCoverage.playersWithSamples,
        percent: coveragePercent(skillCoverage.playersWithSamples, totalPlayers),
        hint: "Distinct players holding at least one round statistic.",
      },
      {
        id: "rounds",
        label: "Round Statistics",
        value: formatCount(skillCoverage.roundStatistics),
        count: skillCoverage.roundStatistics,
        hint: "Total per-round statistic rows held.",
      },
      {
        id: "strokes-gained",
        label: "Rounds With SG",
        value: skillNoSg ? "None (not entitled)" : formatCount(skillCoverage.roundsWithStrokesGained),
        count: skillCoverage.roundsWithStrokesGained,
        percent: skillPercent,
        hint: "Rounds carrying at least one strokes-gained value — the ratings' backbone.",
      },
      {
        id: "seasons",
        label: "Seasons",
        value: formatCount(skillCoverage.seasons),
        count: skillCoverage.seasons,
        hint: "Distinct seasons represented across held samples.",
      },
      {
        id: "freshness",
        label: "Newest Round",
        value: formatRelativeAge(skillCoverage.latestRoundAt, now),
        hint: "Age of the most recent sampled round.",
      },
      {
        id: "coverage",
        label: "SG Coverage %",
        value: skillEmpty ? "No data" : formatPercent(skillPercent),
        percent: skillPercent,
      },
    ],
  })

  // --- DFS Value Model (flagship composite) --------------------------------
  // Unlike the raw feeds above, DFS Value is a DERIVED model: it fuses every
  // Signal Family with each player's real DraftKings salary. Its "coverage" is
  // therefore READINESS, gated by two independent inputs:
  //   1. Real DraftKings salaries (the denominator of value), and
  //   2. At least one gradable QUALITY family (skill SG or linked betting odds)
  //      so a strength composite can actually be computed.
  // When either input is missing the model is `restricted` (a limitation, not a
  // low score) — value is never fabricated from salary alone.
  const dfsPriced = dfsSalaryCoverage.pricedRows
  const dfsHasSalaries = dfsPriced > 0
  const qualityFamilyLive = !skillRestricted || !bettingEmpty
  const dfsRestricted = !dfsHasSalaries || !qualityFamilyLive
  const dfsPercent = dfsHasSalaries
    ? coveragePercent(dfsSalaryCoverage.pricedRows, dfsSalaryCoverage.totalRows || dfsPriced)
    : null
  const dfsRestrictedReason = !dfsHasSalaries
    ? "No DraftKings salaries captured yet — DFS value ranks automatically once a slate is imported and at least one quality family (player skill or betting market) is gradable. Nothing is estimated."
    : !qualityFamilyLive
      ? "DraftKings salaries are held, but no quality family (strokes-gained player skill or linked betting market) is gradable yet, so quality-per-dollar cannot be computed. Value is never fabricated from salary alone."
      : undefined
  sections.push({
    id: "dfs-value",
    title: "DFS Value Model",
    description:
      "The flagship composite: salary-adjusted value fusing every signal family (player skill, course fit, form, betting market, weather) with each player's real DraftKings salary. Readiness tracks priced players and whether a quality family is gradable — value is never fabricated from salary alone.",
    percent: dfsPercent,
    rating: dfsRestricted ? "restricted" : rateCoverage(dfsPercent),
    breakdown: {
      verified: dfsPriced,
      pending: 0,
      missing: Math.max(dfsSalaryCoverage.totalRows - dfsPriced, 0),
      total: dfsSalaryCoverage.totalRows,
    },
    lastUpdated: toIso(dfsSalaryCoverage.latestCapturedAt),
    restrictedReason: dfsRestrictedReason,
    metrics: [
      {
        id: "priced-players",
        label: "Priced Players",
        value: dfsHasSalaries ? formatCount(dfsSalaryCoverage.pricedPlayers) : "None slated",
        count: dfsSalaryCoverage.pricedPlayers,
        hint: "Distinct players carrying a real DraftKings salary (value's denominator).",
      },
      {
        id: "priced-tournaments",
        label: "Slated Tournaments",
        value: formatCount(dfsSalaryCoverage.tournamentsWithSalaries),
        count: dfsSalaryCoverage.tournamentsWithSalaries,
        hint: "Tournaments with at least one priced entrant.",
      },
      {
        id: "quality-family",
        label: "Quality Family Live",
        value: qualityFamilyLive ? "Yes" : "Not yet",
        hint: "Whether player skill (SG) or a linked betting market can be scored — required to grade quality-per-dollar.",
      },
      {
        id: "operators",
        label: "DFS Operators",
        value: dfsSalaryCoverage.operators > 0 ? formatCount(dfsSalaryCoverage.operators) : "None",
        count: dfsSalaryCoverage.operators,
        hint: "Distinct salary providers held (DraftKings preferred by the model).",
      },
      {
        id: "freshness",
        label: "Newest Salary",
        value: formatRelativeAge(dfsSalaryCoverage.latestCapturedAt, now),
        hint: "Age of the most recent captured salary slate.",
      },
      {
        id: "readiness",
        label: "Pricing Readiness %",
        value: dfsHasSalaries ? formatPercent(dfsPercent) : "No data",
        percent: dfsPercent,
      },
    ],
  })

  // --- Platform summary tiles ----------------------------------------------
  const tournamentsWithVenue = tournamentVenueRows.length
  const tournamentsPercent = coveragePercent(tournamentsWithVenue, totalTournaments)
  const summary: DomainSummary[] = [
    { id: "players", label: "Players", percent: playerPercent, rating: rateCoverage(playerPercent), verified: fullyEnriched, total: totalPlayers },
    { id: "courses", label: "Courses", percent: geoPercent, rating: rateCoverage(geoPercent), verified: verifiedCoords, total: totalCourses },
    { id: "tournaments", label: "Tournaments", percent: tournamentsPercent, rating: rateCoverage(tournamentsPercent), verified: tournamentsWithVenue, total: totalTournaments },
    { id: "weather", label: "Weather", percent: weatherPercent, rating: rateCoverage(weatherPercent), verified: forecastAvailable, total: totalTournaments },
    { id: "course-intelligence", label: "Course Intelligence", percent: ciPercent, rating: rateCoverage(ciPercent), verified: verifiedProfiles, total: totalCourses },
    { id: "rankings", label: "Rankings", percent: rankingPercent, rating: rateCoverage(rankingPercent), verified: rankedPlayers, total: totalPlayers },
    { id: "news", label: "News", percent: newsPercent, rating: rateCoverage(newsPercent), verified: playerLinkedArticles, total: totalArticles },
    { id: "images", label: "Images", percent: photoPercent, rating: rateCoverage(photoPercent), verified: playersWithPhoto, total: totalPlayers },
    { id: "fantasy", label: "Fantasy", percent: fantasyPercent, rating: fantasyHasRealData ? rateCoverage(fantasyPercent) : "restricted", verified: dfsReal, total: dfsTotal, restricted: !fantasyHasRealData },
    { id: "betting", label: "Betting", percent: bettingPercent, rating: bettingEmpty ? "restricted" : rateCoverage(bettingPercent), verified: oddsEventsLinked, total: oddsEvents, restricted: bettingEmpty },
    { id: "player-skill", label: "Player Skill", percent: skillPercent, rating: skillRestricted ? "restricted" : rateCoverage(skillPercent), verified: skillCoverage.roundsWithStrokesGained, total: skillCoverage.roundStatistics, restricted: skillRestricted },
    { id: "dfs-value", label: "DFS Value", percent: dfsPercent, rating: dfsRestricted ? "restricted" : rateCoverage(dfsPercent), verified: dfsPriced, total: dfsSalaryCoverage.totalRows, restricted: dfsRestricted },
  ]

  const health = await buildPlatformHealth({
    now,
    bettingRestricted: bettingEmpty,
  })

  const fieldIntelligence = await buildFieldIntelligence(new Date(now))

  return {
    generatedAt: new Date(now).toISOString(),
    summary,
    sections,
    fieldIntelligence,
    health,
  }
}

/**
 * Build the Tournament Field Intelligence panel: every upcoming/live event with
 * its official-field lifecycle state (from the SAME pure engine the Tournament
 * Page uses, so the admin view and the public banner never disagree) and the
 * operational facts an admin needs — imported vs. expected size, last sync, and
 * an "overdue" flag when the field should be out (release deadline passed) but
 * no roster has landed. Honest by construction: it never invents a field, and
 * `expectedPlayers` is `null` (not a guess) when there is no prior edition.
 */
async function buildFieldIntelligence(now: Date): Promise<FieldIntelligenceReport> {
  const rows = await getTournamentRepository().listFieldIntelligence(30)

  const reportRows: FieldIntelligenceReportRow[] = rows.map((row) => {
    // Derive lifecycle from the shared engine. Status text mirrors the DB enum;
    // COMPLETED events are already excluded by the query.
    const status =
      row.status === "ACTIVE"
        ? "ACTIVE"
        : row.status === "CANCELED"
          ? "CANCELED"
          : "SCHEDULED"
    const intel = deriveFieldIntelligence({
      status,
      startDate: row.startDate,
      endDate: row.endDate,
      fieldConfirmed: row.playersImported > 0,
      fieldPlayerCount: row.playersImported > 0 ? row.playersImported : null,
    })

    // "Overdue" = the official field should have been published by now (the
    // commitment deadline has passed) yet nothing has been imported. This is the
    // one actionable signal — a field that is genuinely late, not merely pending.
    const overdue =
      intel.fieldStatus === "awaiting" &&
      intel.fieldReleaseTime !== null &&
      new Date(intel.fieldReleaseTime).getTime() < now.getTime()

    return {
      tournamentId: row.id,
      name: row.name,
      fieldStatus: intel.fieldStatus,
      fieldConfidence: intel.fieldConfidence,
      startDate: row.startDate ? row.startDate.toISOString() : null,
      releaseTime: intel.fieldReleaseTime,
      playersImported: row.playersImported,
      expectedPlayers: row.expectedPlayers,
      lastSync: row.lastSync ? row.lastSync.toISOString() : null,
      overdue,
    }
  })

  return {
    rows: reportRows,
    overdueCount: reportRows.filter((r) => r.overdue).length,
    confirmedCount: reportRows.filter((r) => r.fieldStatus === "confirmed").length,
    awaitingCount: reportRows.filter((r) => r.fieldStatus === "awaiting").length,
  }
}

interface HealthInputs {
  now: number
  bettingRestricted: boolean
}

/**
 * Human labels and stable ordering for the pipelines the dashboard reports on.
 * Keyed by the `entity` string each `runXImport()` records. Any entity that has
 * run but is not listed here still surfaces (appended, title-cased) so a new
 * pipeline is never silently hidden.
 */
const IMPORT_RUN_LABELS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "player", label: "Players" },
  { id: "tournament", label: "Tournaments" },
  { id: "course", label: "Courses" },
  { id: "field", label: "Tournament Fields" },
  { id: "statistics", label: "Player Statistics" },
  { id: "geolocation", label: "Course Geolocation" },
  { id: "weather", label: "Weather" },
  { id: "news", label: "News" },
  { id: "betting", label: "Betting" },
  { id: "odds", label: "Odds" },
  { id: "fantasy", label: "Fantasy / DFS" },
  { id: "course-link", label: "Course Linking" },
]

function titleCaseEntity(entity: string): string {
  return entity
    .split(/[-_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}

/**
 * Real per-pipeline import health, read from the append-only `import_runs`
 * audit trail. Pipelines that have a recorded run report their genuine last
 * outcome and row counts; pipelines that have never run report `"never"` with
 * null counts — no `updatedAt` guessing, no implied zero-row success.
 */
async function buildImportRunHealth(): Promise<ImportRunHealth[]> {
  const latest = await getImportRunRepository().latestPerEntity()
  const byEntity = new Map(latest.map((r) => [r.entity, r]))

  const knownIds = new Set(IMPORT_RUN_LABELS.map((l) => l.id))
  const extraEntities = latest
    .filter((r) => !knownIds.has(r.entity))
    .map((r) => ({ id: r.entity, label: titleCaseEntity(r.entity) }))
  const ordered = [...IMPORT_RUN_LABELS, ...extraEntities]

  return ordered.map(({ id, label }) => {
    const run = byEntity.get(id)
    if (!run) {
      return {
        id,
        label,
        provider: null,
        outcome: "never" as const,
        at: null,
        durationMs: null,
        inserted: null,
        updated: null,
        skipped: null,
        failed: null,
        summary: null,
        error: null,
      }
    }
    return {
      id,
      label,
      provider: run.provider,
      outcome: run.status,
      at: run.startedAt.toISOString(),
      durationMs: run.durationMs,
      inserted: run.inserted,
      updated: run.updated,
      skipped: run.skipped,
      failed: run.failed,
      summary: run.summary,
      error: run.error,
    }
  })
}

async function buildPlatformHealth(inputs: HealthInputs): Promise<PlatformHealth> {
  let databaseHealthy = false
  try {
    await prisma.$queryRaw`SELECT 1`
    databaseHealthy = true
  } catch {
    databaseHealthy = false
  }

  const sportsDataConfigured = Boolean(process.env.SPORTSDATAIO_API_KEY)
  const weatherConfigured = Boolean(process.env.OPENWEATHER_API_KEY)
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY)

  const checks: HealthCheck[] = [
    {
      id: "sportsdataio",
      label: "SportsDataIO",
      state: sportsDataConfigured ? "connected" : "not-configured",
      detail: sportsDataConfigured
        ? "API key present (trial tier — several premium feeds are scrambled)."
        : "SPORTSDATAIO_API_KEY is not set.",
    },
    {
      id: "openweather",
      label: "OpenWeather",
      state: weatherConfigured ? "connected" : "not-configured",
      detail: weatherConfigured
        ? "API key present; forecasts can be fetched for verified venues."
        : "OPENWEATHER_API_KEY is not set — weather cannot be refreshed.",
    },
    {
      id: "odds",
      label: "Odds Provider",
      state: inputs.bettingRestricted ? "restricted" : "connected",
      detail: inputs.bettingRestricted
        ? "No odds captured yet — run the odds import to pull real bookmaker prices from The Odds API."
        : "Real bookmaker prices are flowing from The Odds API.",
    },
    {
      id: "openai",
      label: "OpenAI",
      state: openAiConfigured ? "connected" : "not-configured",
      detail: openAiConfigured
        ? "AI credentials present."
        : "No OPENAI_API_KEY / AI_GATEWAY_API_KEY set — AI features are inactive.",
    },
    {
      id: "database",
      label: "Database",
      state: databaseHealthy ? "healthy" : "unreachable",
      detail: databaseHealthy ? "Neon Postgres responded to a liveness probe." : "Liveness probe failed.",
    },
  ]

  const runs = await buildImportRunHealth()

  return { checks, runs }
}
