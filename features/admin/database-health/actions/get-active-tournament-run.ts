"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get the most recent tournament mapping workflow run on component mount.
 * This allows the UI to reconnect to a running workflow after browser refresh.
 */
export async function getActiveTournamentRunAction() {
  try {
    // Verify authentication
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Call the active-run endpoint
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/admin/tournament-mapping/active-run`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: hdrs.get("cookie") || "",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const result = await response.json();

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("[v0] Error getting active tournament run:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
