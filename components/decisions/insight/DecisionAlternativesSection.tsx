import type { DecisionInsightViewModel } from "@/lib/operator/decision-insight-model";

export function DecisionAlternativesSection({
  alternatives,
}: {
  alternatives: DecisionInsightViewModel["alternatives"];
}) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised/50 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Alternatives
      </h2>
      <p className="mt-3 text-sm text-slate-400">{alternatives.message}</p>
      {!alternatives.exposedByApi ? (
        <p className="mt-2 text-xs text-slate-600">
          ControlPlane does not synthesize alternative options or scores. If your platform adds
          an alternatives array to the visibility contract, it can be rendered here without UI-side
          logic.
        </p>
      ) : null}
    </section>
  );
}
