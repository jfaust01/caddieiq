/**
 * DFS Value Model — the flagship composite. Pure, deterministic, dependency-free
 * scoring that fuses every Signal Family (Player Skill, Course Fit, Form &
 * Production, Market, Weather) with the real DraftKings salary into one
 * explainable value score. Confidence is ceiling-capped by how much verified
 * data actually backs each pick, so the model degrades honestly on the current
 * data tier and lights up automatically as families arrive.
 *
 * This barrel is safe to import from anywhere (no server-only code); the
 * request-scoped service in ./service.ts owns all data access.
 */

export * from "./types"
export { buildDfsValueField, DFS_FAMILY_CONFIG, TIER_LABEL } from "./model"
export { buildDfsBoards } from "./leaderboards"
