import { CopyableId } from "@/components/operator/CopyableId";
import type { DecisionInsightViewModel } from "@/lib/operator/decision-insight-model";

export function DecisionOutcomeCard({
  outcome,
  traceIdentifiers,
}: {
  outcome: DecisionInsightViewModel["outcome"];
  traceIdentifiers: DecisionInsightViewModel["traceIdentifiers"];
}) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised/50 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Decision outcome
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Recorded result from the visibility API — not recomputed in ControlPlane.
      </p>
      <div className="mt-4 space-y-3">
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-start">
          <div className="text-sm text-slate-500">Decision id</div>
          <CopyableId value={outcome.decisionId} copyLabel="Copy decision id" />
        </div>
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-baseline">
          <div className="text-sm text-slate-500">Selected option</div>
          <SelectedOptionBlock selected={outcome.selectedOption} />
        </div>
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-baseline">
          <div className="text-sm text-slate-500">Type</div>
          <div className="text-sm font-medium text-white">{outcome.decisionType}</div>
        </div>
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-baseline">
          <div className="text-sm text-slate-500">Category</div>
          <div className="text-sm text-slate-300">{outcome.decisionCategory}</div>
        </div>
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-baseline">
          <div className="text-sm text-slate-500">Status</div>
          <div className="inline-flex w-fit rounded-md border border-surface-border bg-black/30 px-2 py-0.5 font-mono text-xs text-slate-200">
            {outcome.status}
          </div>
        </div>
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-baseline">
          <div className="text-sm text-slate-500">Occurred (UTC)</div>
          <div className="font-mono text-sm text-slate-300">
            {formatIso(outcome.occurredAtUtc)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800/80 bg-black/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Output summary (recorded)
          </p>
          <p className="mt-2 break-words text-sm text-slate-200 whitespace-pre-wrap">
            {outcome.resultSummary}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800/80 bg-black/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Trace & correlation identifiers
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Same strings the API returned — legacy names preserved for operator alignment with
            SignalForge docs.
          </p>
          <dl className="mt-3 space-y-3">
            {traceIdentifiers.map((row) => (
              <div key={row.label}>
                <dt className="text-xs text-slate-500">{row.label}</dt>
                <dd className="mt-1">
                  {row.value ? (
                    <CopyableId value={row.value} copyLabel={`Copy ${row.label}`} />
                  ) : (
                    <span className="text-sm text-slate-500">Not present</span>
                  )}
                  {row.note ? (
                    <p className="mt-1 text-xs text-slate-600">{row.note}</p>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function SelectedOptionBlock({
  selected,
}: {
  selected: DecisionInsightViewModel["outcome"]["selectedOption"];
}) {
  if (selected.kind === "id") {
    return <CopyableId value={selected.value} copyLabel="Copy selected option id" />;
  }
  if (selected.kind === "not_exposed") {
    return (
      <p className="text-sm text-slate-400">
        No selection metadata exposed — <code className="text-slate-500">selectedOptionId</code> is
        not part of this visibility contract for this record.
      </p>
    );
  }
  if (selected.kind === "explicit_null" || selected.kind === "explicit_empty") {
    return (
      <p className="text-sm text-amber-200/90">
        No selected option recorded — backend supplied an empty{" "}
        <code className="text-slate-500">selectedOptionId</code>.
      </p>
    );
  }
  return null;
}

function formatIso(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "full",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}
