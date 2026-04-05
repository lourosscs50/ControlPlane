import type { DecisionInsightViewModel } from "@/lib/operator/decision-insight-model";

export function DecisionDebugStatusSection({
  debug,
}: {
  debug: DecisionInsightViewModel["debug"];
}) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised/50 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Debug status / degradation
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Envelope-backed steps and counters only. Stages are not a reconstructed runtime trace — when
        a step reads &quot;not in envelope&quot;, the API did not expose structured data for it.
      </p>

      <div className="mt-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Flow signals (from fields)
        </h3>
        <ol className="mt-3 space-y-4 border-l border-slate-700 pl-4">
          {debug.timeline.map((step) => (
            <li key={step.id} className="relative">
              <span
                className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface-border bg-slate-900"
                aria-hidden
              />
              <p className="text-sm font-medium text-slate-200">{step.title}</p>
              <p className="mt-1 text-xs font-mono uppercase tracking-wide text-slate-500">
                {dispositionLabel(step.disposition)}
              </p>
              <p className="mt-1 text-sm text-slate-400">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 border-t border-surface-border pt-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Explanation counters & summaries
        </h3>
        <div className="mt-4 space-y-3 text-sm">
          <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-baseline">
            <div className="text-slate-500">Confidence band</div>
            <div className="font-mono text-slate-300">
              {debug.confidenceBand?.trim() || "Not reported"}
            </div>
          </div>
          <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-baseline">
            <div className="text-slate-500">Fallback usage count</div>
            <div className="font-mono text-slate-300">
              {debug.fallbackUsageCount != null
                ? String(debug.fallbackUsageCount)
                : "Not reported"}
            </div>
          </div>
          <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-baseline">
            <div className="text-slate-500">Retry usage count</div>
            <div className="font-mono text-slate-300">
              {debug.retryUsageCount != null
                ? String(debug.retryUsageCount)
                : "Not reported"}
            </div>
          </div>
          {debug.reliabilityFallbackUsed != null ? (
            <div className="rounded-lg border border-slate-800/80 bg-black/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                A.I.L. reliability snapshot
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Fallback used:{" "}
                <span className="font-mono">
                  {debug.reliabilityFallbackUsed ? "yes" : "no"}
                </span>
              </p>
              {debug.reliabilitySummaryLines.length ? (
                <ul className="mt-2 list-inside list-disc font-mono text-xs text-slate-400">
                  {debug.reliabilitySummaryLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start">
            <div className="text-slate-500">Safe error summary</div>
            <div className="break-words text-slate-300 whitespace-pre-wrap">
              {debug.safeErrorSummary ?? "—"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function dispositionLabel(d: DecisionInsightViewModel["debug"]["timeline"][number]["disposition"]) {
  switch (d) {
    case "reported":
      return "Reported";
    case "reported_empty":
      return "Reported empty";
    case "not_in_envelope":
      return "Not in envelope";
    default:
      return d;
  }
}
