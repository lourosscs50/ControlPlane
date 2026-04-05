import type { DecisionInsightViewModel } from "@/lib/operator/decision-insight-model";

export function DecisionInsightSummaryCard({
  insight,
}: {
  insight: DecisionInsightViewModel["insightSummary"];
}) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised/50 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Insight summary
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Bounded explanation surface from the backend — no chain-of-thought or raw prompts. Chips
        below are only shown when an envelope field supports them.
      </p>
      {insight.stateBadges.length ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Envelope-backed state indicators">
          {insight.stateBadges.map((b, i) => (
            <li
              key={`${b.label}-${b.basisNote ?? i}`}
              className="rounded-md border border-surface-border bg-black/35 px-2.5 py-1"
            >
              <span className="text-xs font-medium text-slate-200">{b.label}</span>
              {b.basisNote ? (
                <span className="mt-0.5 block font-mono text-[10px] text-slate-500">
                  {b.basis === "envelope" ? "Source: " : "Note: "}
                  {b.basisNote}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {insight.operatorLines.length ? (
        <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-400">
          {insight.operatorLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 space-y-3 text-sm">
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-baseline">
          <div className="text-slate-500">Explanation available</div>
          <div className="text-slate-200">
            {insight.explanationAvailable ? "Yes" : "No"}
          </div>
        </div>
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-start">
          <div className="text-slate-500">Summary</div>
          <div className="break-words text-slate-300 whitespace-pre-wrap">
            {insight.summaryText ?? "—"}
          </div>
        </div>
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-start">
          <div className="text-slate-500">Reason codes</div>
          <div>
            {insight.reasonCodes?.length ? (
              <ul className="flex flex-wrap gap-2">
                {insight.reasonCodes.map((c) => (
                  <li
                    key={c}
                    className="rounded border border-surface-border px-2 py-0.5 font-mono text-xs text-slate-300"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-slate-500">—</span>
            )}
          </div>
        </div>
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-start">
          <div className="text-slate-500">Recommended downstream</div>
          <div className="break-words text-slate-300 whitespace-pre-wrap">
            {insight.recommendedDownstream ?? "—"}
          </div>
        </div>
      </div>
    </section>
  );
}
