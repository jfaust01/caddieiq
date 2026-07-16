"use server"

/**
 * Server actions for manual Weather Intelligence refreshes.
 *
 * A "Refresh Weather" control (rendered only to admins on the tournament page)
 * calls {@link refreshTournamentWeather} to trigger an on-demand import for a
 * single event — the same pipeline the daily scheduled import runs, so it writes
 * a real {@link runWeatherImport} run row and a per-tournament `WeatherImportLog`.
 * Nothing is fabricated: the action reports exactly what the provider returned.
 *
 * Security: every call re-checks the caller's ADMIN role on the server via
 * {@link isCurrentUserAdmin}. A non-admin (or anonymous) caller is refused with
 * a coarse `FORBIDDEN` code and no import is performed, regardless of what the
 * client rendered.
 */

import { revalidatePath } from "next/cache"

import { runWeatherImport } from "@/lib/imports"
import { isCurrentUserAdmin } from "@/lib/session"

/** Discriminated result the client can render without catching. */
export type RefreshWeatherResult =
  | { ok: true; outcome: "stored" | "skipped"; message: string }
  | { ok: false; error: "FORBIDDEN" | "INVALID" | "FAILED"; message: string }

/** Bound the input so a malformed id never reaches the pipeline. */
function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 64
}

/**
 * Refresh the forecast for a single tournament on demand. Admin-only. Forces a
 * fetch (no freshness short-circuit) since an operator asked for it explicitly,
 * then revalidates the tournament page so the new status/forecast renders.
 */
export async function refreshTournamentWeather(
  tournamentId: string,
): Promise<RefreshWeatherResult> {
  if (!(await isCurrentUserAdmin())) {
    return {
      ok: false,
      error: "FORBIDDEN",
      message: "Only administrators can refresh weather.",
    }
  }

  if (!isValidId(tournamentId)) {
    return { ok: false, error: "INVALID", message: "A valid tournament id is required." }
  }

  try {
    const summary = await runWeatherImport([tournamentId])

    if (summary.stored > 0) {
      revalidatePath(`/tournaments/${tournamentId}`)
      return {
        ok: true,
        outcome: "stored",
        message: `Forecast updated — ${summary.periodsStored} periods imported.`,
      }
    }

    if (summary.failed > 0) {
      // The pipeline recorded the failure (run row + per-tournament log); relay
      // the first honest note to the operator rather than a generic error.
      return {
        ok: false,
        error: "FAILED",
        message: summary.notes[0] ?? "The forecast import did not complete.",
      }
    }

    // Considered but not stored and not failed → a legitimate skip (no host
    // course, no coordinates, or provider returned no usable periods).
    revalidatePath(`/tournaments/${tournamentId}`)
    return {
      ok: true,
      outcome: "skipped",
      message: summary.notes[0] ?? "No forecast was available to import for this event.",
    }
  } catch (error) {
    console.error(
      "[tournaments] refreshTournamentWeather failed:",
      error instanceof Error ? error.message : error,
    )
    return { ok: false, error: "FAILED", message: "The forecast import did not complete." }
  }
}
