import type { DecisionInsightViewModel } from "@/lib/operator/decision-insight-model";

export function DecisionAlternativesSection({
  alternatives,
}: {
  alternatives: DecisionInsightViewModel["alternatives"];
}) {
  if (alternatives.mode === "not_in_contract") {
    return (
      <section className="rounded-xl border border-surface-border bg-surface-raised/50 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Alternatives
        </h2>
        <p className="mt-3 text-sm text-slate-400">{alternatives.message}</p>
        <p className="mt-2 text-xs text-slate-600">
          When backends add a <code className="text-slate-500">decisionOptions</code> array to the
          visibility contract, options render here in server order without fabricated scores.
        </p>
      </section>
    );
  }

  const { options, selectedOptionId } = alternatives;

  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised/50 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alternatives</h2>
      <p className="mt-1 text-xs text-slate-600">
        Options below are echoed from <code className="text-slate-500">decisionOptions</code> in API
        order. Selected row uses <code className="text-slate-500">selectedOptionId</code> when it
        matches — no ranking or scoring is applied in ControlPlane.
      </p>
      {!options.length ? (
        <p className="mt-4 text-sm text-amber-200/90" role="status">
          No options were returned — the contract included an empty list or null collection.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {options.map((o) => {
            const isSel = selectedOptionId != null && o.optionId === selectedOptionId;
            return (
              <li
                key={o.optionId}
                className={`rounded-lg border px-4 py-3 ${
                  isSel
                    ? "border-accent-muted/50 bg-accent-muted/10"
                    : "border-surface-border bg-black/20"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-white">{o.optionId}</span>
                  {isSel ? (
                    <span className="rounded border border-surface-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-muted">
                      Selected
                    </span>
                  ) : null}
                </div>
                {o.summary ? (
                  <p className="mt-2 text-sm text-slate-400 whitespace-pre-wrap">{o.summary}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-600">No per-option summary on this row.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {selectedOptionId && !options.some((o) => o.optionId === selectedOptionId) ? (
        <p className="mt-4 text-sm text-amber-200/90" role="status">
          <code className="text-slate-500">selectedOptionId</code> ({selectedOptionId}) does not
          match any returned option id — operator should verify contract consistency upstream.
        </p>
      ) : null}
    </section>
  );
}
