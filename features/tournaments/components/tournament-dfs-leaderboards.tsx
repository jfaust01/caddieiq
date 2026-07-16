import type {
  DfsBoard,
  DfsBoardEntry,
  DfsConfidence,
  DfsContextCeiling,
  DfsValueField,
} from "@/lib/dfs-value"

/* ------------------------------------------------------------------ */
/* Presentation helpers (pure)                                        */
/* ------------------------------------------------------------------ */

const CONFIDENCE_LABEL: Record<DfsConfidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  none: "Not gradable yet",
}

const CEILING_NOTE: Record<DfsContextCeiling, string> = {
  verified: "Full tournament context — host course resolved.",
  partial: "Partial context — no host course linked yet, so confidence is capped.",
  unavailable: "No confirmed tournament context, so DFS value cannot be graded.",
}

function formatSalary(salary: number | null): string {
  if (salary == null) return "No salary"
  return `$${salary.toLocaleString("en-US")}`
}

function scoreLabel(score: number | null): string {
  return score == null ? "—" : String(score)
}

/* ------------------------------------------------------------------ */
/* Board row                                                          */
/* ------------------------------------------------------------------ */

function BoardRow({ entry }: { entry: DfsBoardEntry }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <span className="w-6 shrink-0 text-center font-mono text-sm text-muted-foreground">{entry.rank}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-card-foreground">{entry.displayName}</p>
        <p className="truncate text-sm text-muted-foreground text-pretty">{entry.headline}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4 text-right">
        <div>
          <p className="font-mono text-sm text-card-foreground">{formatSalary(entry.salary)}</p>
          <p className="text-xs text-muted-foreground">Salary</p>
        </div>
        <div className="w-12">
          <p className="font-mono text-lg font-semibold text-card-foreground">{scoreLabel(entry.score)}</p>
          <p className="text-xs text-muted-foreground">Value</p>
        </div>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Board card                                                         */
/* ------------------------------------------------------------------ */

function BoardCard({ board }: { board: DfsBoard }) {
  return (
    <section
      aria-labelledby={`dfs-board-${board.key}`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4"
    >
      <header className="flex flex-col gap-1">
        <h3 id={`dfs-board-${board.key}`} className="font-semibold text-foreground text-balance">
          {board.title}
        </h3>
        <p className="text-sm text-muted-foreground text-pretty">{board.description}</p>
      </header>

      {board.entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No entrants qualify for this board yet.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {board.entries.map((entry) => (
            <BoardRow key={entry.playerId} entry={entry} />
          ))}
        </ol>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Section                                                            */
/* ------------------------------------------------------------------ */

export function TournamentDfsLeaderboards({ field }: { field: DfsValueField }) {
  const hasAnyBoard = field.boards.some((board) => board.entries.length > 0)

  return (
    <section aria-labelledby="dfs-leaderboards-heading" className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 id="dfs-leaderboards-heading" className="text-xl font-semibold text-foreground text-balance">
          DFS value leaderboards
        </h2>
        <p className="text-sm text-muted-foreground text-pretty">
          Salary-adjusted value for the field, fusing every signal family with each player&apos;s DraftKings
          salary. {CEILING_NOTE[field.ceiling]}
        </p>
      </header>

      <dl className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">Rated</dt>
          <dd className="font-mono font-medium text-card-foreground">
            {field.ratedPlayers}/{field.totalPlayers}
          </dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">Priced</dt>
          <dd className="font-mono font-medium text-card-foreground">
            {field.pricedPlayers}/{field.totalPlayers}
          </dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">Field grade</dt>
          <dd className="font-medium text-card-foreground">{CONFIDENCE_LABEL[field.averageConfidence]}</dd>
        </div>
      </dl>

      {hasAnyBoard ? (
        <div className="grid gap-4 md:grid-cols-2">
          {field.boards.map((board) => (
            <BoardCard key={board.key} board={board} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="font-medium text-foreground">DFS value is not available for this field yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground text-pretty">
            {field.totalPlayers === 0
              ? "No confirmed field has been published for this tournament."
              : field.pricedPlayers === 0
                ? "No DraftKings salaries have been published for this field yet. Value ranks the moment salaries and a scored signal family arrive."
                : "No signal family can be scored for this field yet, so quality-per-dollar cannot be estimated. Nothing is fabricated."}
          </p>
        </div>
      )}
    </section>
  )
}
