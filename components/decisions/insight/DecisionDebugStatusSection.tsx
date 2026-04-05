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
        Only fields present on the visibility envelope. Absent counts are unknown — not zero.
      </p>
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
    </section>
  );
}
