import { toDecisionTrace, type Explanation } from "@/lib/explainability"
import { MetricLabel } from "@/features/explainability/components/metric-info"

/**
 * Developer Trace — a dense, engineering-oriented audit of a model's Decision
 * Trace. Unlike the user-facing timeline (which hides raw math), this exposes
 * every stage's raw input, normalized value, weight, and signed contribution
 * alongside the derived category, impact, confidence, and whether the stage
 * influenced the outcome. It reads from the same pure `toDecisionTrace` builder
 * as the user surfaces, but pairs each stage with the underlying Explanation
 * contributor so admins can verify the mapping is faithful. Nothing is
 * recomputed and nothing is hidden.
 */
export function DeveloperTrace({ explanation }: { explanation: Explanation }) {
  const trace = toDecisionTrace(explanation)
  // Index contributors by key so each trace stage can show its raw math.
  const byKey = new Map(explanation.contributors.map((c) => [c.key, c]))

  const num = (v: number | null, digits = 2) =>
    v === null ? "—" : Number.isInteger(v) ? String(v) : v.toFixed(digits)

  return (
    <div className="flex flex-col gap-6 font-mono text-xs">
      {/* Headline / final result */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-4">
        <Field label="model.id" value={trace.modelId} />
        <Field label="headline.value" value={num(trace.headlineValue)} />
        <Field label="headline.display" value={trace.headlineDisplay} />
        <Field label="confidence" value={`${trace.overallConfidence} (${trace.overallConfidenceLabel})`} />
        <Field label="subject" value={`${trace.subject.kind}:${trace.subject.id}`} />
        <Field label="stages" value={String(trace.stages.length)} />
        <Field label="limitations" value={String(trace.limitations.length)} />
        <Field label="generatedAt" value={trace.generatedAt} />
      </dl>

      {/* Stage table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {[
                { label: "#", key: null },
                { label: "stage", key: null },
                { label: "category", key: null },
                { label: "impact", key: null },
                { label: "raw", key: "raw-value" },
                { label: "normalized", key: "normalized-value" },
                { label: "weight%", key: "weight-percentage" },
                { label: "contribution", key: "contribution" },
                { label: "conf", key: "confidence-level" },
                { label: "influences", key: null },
              ].map(({ label, key }) => (
                <th key={label} className="whitespace-nowrap px-3 py-2 font-medium">
                  <div className="flex items-center gap-1">
                    {label}
                    {key && <MetricLabel metricKey={key} label="" iconClassName="w-2.5 h-2.5" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trace.stages.map((stage, i) => {
              const c = byKey.get(stage.id)
              const rawDisplay =
                c && typeof c.rawValue === "number"
                  ? num(c.rawValue)
                  : c && typeof c.rawValue === "string"
                    ? c.rawValue
                    : "—"
              return (
                <tr key={stage.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{stage.title}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{stage.category}</td>
                  <td
                    className="px-3 py-2"
                    style={{
                      color:
                        stage.impact === "positive"
                          ? "var(--color-chart-2)"
                          : stage.impact === "negative"
                            ? "var(--color-destructive)"
                            : "var(--color-muted-foreground)",
                    }}
                  >
                    {stage.impact}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{rawDisplay}</td>
                  <td className="px-3 py-2 text-muted-foreground">{num(c?.normalizedValue ?? null)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{num(stage.weightPct, 1)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{num(c?.contribution ?? null)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{stage.confidence}</td>
                  <td className="px-3 py-2 text-muted-foreground">{stage.influencesOutcome ? "yes" : "no"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Missing inputs / limitations */}
      <div className="flex flex-col gap-2">
        <p className="font-sans text-sm font-medium text-foreground">Missing inputs &amp; limitations</p>
        {trace.limitations.length === 0 ? (
          <p className="text-muted-foreground">None — the model resolved on complete inputs.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {trace.limitations.map((lim, i) => (
              <li key={i} className="text-muted-foreground">
                <span className="text-foreground">[{lim.code}]</span> {lim.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[0.625rem] uppercase tracking-wide text-muted-foreground/70">{label}</dt>
      <dd className="break-all text-foreground">{value}</dd>
    </div>
  )
}
