"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { PageShell } from "@/components/shared/page-shell"
import { CaddieChat } from "@/features/caddie/components/caddie-chat"
import type { CaddieTournamentOption } from "@/features/caddie/services/caddie-service"

const STATUS_LABEL: Record<CaddieTournamentOption["status"], string> = {
  ACTIVE: "In progress",
  SCHEDULED: "Upcoming",
  COMPLETED: "Completed",
  CANCELED: "Canceled",
}

interface CaddieViewProps {
  options: CaddieTournamentOption[]
  activeId: string | null
}

/**
 * Full-page AI Caddie surface. Lets the user pick which tournament the Caddie
 * reasons over, then renders the shared chat. Every answer the chat returns is
 * grounded in that tournament's verified engine output.
 */
export function CaddieView({ options, activeId }: CaddieViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(activeId)
  const selected = options.find((o) => o.id === selectedId) ?? null

  return (
    <PageShell>
      <PageHeader
        eyebrow="AI Caddie"
        title="Ask the Caddie"
        description="A conversational front door to every CaddieIQ engine. Ask about cash plays, course fit, form, odds, or weather — answers are grounded in verified intelligence and always cite their source."
        actions={
          options.length > 0 ? (
            <Select value={selectedId ?? undefined} onValueChange={setSelectedId}>
              <SelectTrigger className="w-64" aria-label="Choose tournament">
                <SelectValue placeholder="Choose a tournament" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name} · {STATUS_LABEL[option.status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null
        }
      />

      {selected ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <span>
              Reasoning over <span className="font-medium text-foreground">{selected.name}</span>
              {selected.course ? ` · ${selected.course}` : ""}
            </span>
          </div>
          <CaddieChat key={selected.id} tournamentId={selected.id} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No tournaments are available yet. Once an event is scheduled and its data is imported, the
          Caddie can start answering questions about it.
        </div>
      )}
    </PageShell>
  )
}
