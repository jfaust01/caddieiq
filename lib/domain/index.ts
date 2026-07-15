/**
 * CaddieIQ domain models + provider mappers.
 *
 * This is the seam the rest of the application depends on. Consumers import
 * domain models (`Player`, `Course`, `Tournament`) and the mapping functions
 * from here — never a provider's raw response types, which stay isolated inside
 * `lib/providers`. The mappers translate provider payloads into these shapes;
 * validation and repositories (persistence) are downstream layers that consume
 * the domain objects.
 *
 * TODO(validation): a validation layer will assert these mapped objects satisfy
 * domain invariants (required names, plausible dates/ranges) before persistence.
 * TODO(repositories): repositories will consume these objects, resolve
 * relationships (nationality, tour/season, venue), assign identity, and upsert
 * by `externalRef`.
 */

// Shared primitives
export type {
  DataSourceName,
  ExternalReference,
  HasExternalReference,
} from "./shared/types"
export { slugify, cleanString, cleanNumber, parseDate } from "./shared/utils"

// Player domain
export type { Player, Handedness, PlayerStatus } from "./player/types"
export { mapSportsDataPlayer } from "./player/mapper"
export {
  DEFAULT_HANDEDNESS,
  DEFAULT_PLAYER_STATUS,
  UNKNOWN_PLAYER_NAME,
} from "./player/constants"

// Course domain
export type { Course } from "./course/types"
export { mapSportsDataCourse } from "./course/mapper"
export { UNKNOWN_COURSE_NAME } from "./course/constants"

// Tournament domain
export type {
  Tournament,
  TournamentStatus,
  TournamentFormat,
} from "./tournament/types"
export { mapSportsDataTournament } from "./tournament/mapper"
export {
  DEFAULT_TOURNAMENT_FORMAT,
  TOURNAMENT_STATUS_BY_IS_OVER,
  UNKNOWN_TOURNAMENT_NAME,
} from "./tournament/constants"
