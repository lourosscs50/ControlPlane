import type { DecisionInsightViewModel } from "@/lib/operator/decision-insight-model";

export function DecisionMissingDataPanel({
  items,
}: {
  items: DecisionInsightViewModel["missing"];
}) {
  if (!items.length) {
    return (
      <section className="rounded-xl border border-slate-800/60 bg-slate-950/20 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Missing / unavailable context
        </h2>
        <p className="mt-3 text-sm text-slate-500">
          No additional gaps flagged for this record beyond normal optional fields.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">
        Missing / unavailable context
      </h2>
      <p className="mt-1 text-xs text-amber-100/70">
        Honest limits of what this API returned — not errors in ControlPlane.
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((m) => (
          <li key={m.label} className="border-t border-amber-900/25 pt-3 first:border-0 first:pt-0">
            <span className="font-medium text-amber-100/90">{m.label}</span>
            <p className="mt-1 text-amber-100/70">{m.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
