import type { DecisionInsightViewModel } from "@/lib/operator/decision-insight-model";

export function DecisionInfluencesSection({
  influences,
}: {
  influences: DecisionInsightViewModel["influences"];
}) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised/50 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Influences / inputs
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Fields the API chose to expose for this decision. Listing them does not assert causality
        or ranking — only what was recorded for operators.
      </p>
      <dl className="mt-4 space-y-4">
        {influences.map((row) => (
          <div key={row.label}>
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className="mt-1 break-words font-mono text-sm text-slate-200 whitespace-pre-wrap">
              {row.value}
            </dd>
            {row.note ? (
              <dd className="mt-1 text-xs text-slate-600">{row.note}</dd>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}
