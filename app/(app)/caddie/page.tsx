import type { Metadata } from "next"

import { CaddieView } from "@/features/caddie/caddie-view"
import { getCaddieTournamentContext } from "@/features/caddie/services/caddie-service"

export const metadata: Metadata = {
  title: "AI Caddie",
  description:
    "Ask CaddieIQ's AI Caddie about cash plays, course fit, form, odds, and weather. Every answer is grounded in verified intelligence and cites its source.",
}

export default async function CaddiePage() {
  const { options, active } = await getCaddieTournamentContext()
  return <CaddieView options={options} activeId={active?.id ?? null} />
}
