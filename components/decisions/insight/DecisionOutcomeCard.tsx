import { CopyableId } from "@/components/operator/CopyableId";
import type { DecisionInsightViewModel } from "@/lib/operator/decision-insight-model";

export function DecisionOutcomeCard({
  outcome,
}: {
  outcome: DecisionInsightViewModel["outcome"];
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
            Output summary (selected outcome)
          </p>
          <p className="mt-2 break-words text-sm text-slate-200 whitespace-pre-wrap">
            {outcome.resultSummary}
          </p>
        </div>
      </div>
    </section>
  );
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
