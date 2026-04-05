import {
  getOperatorStatus,
  type OperatorExecutionStatus,
} from "@/lib/operator/execution-status";
import type { ControlExecutionRecord } from "@/lib/chronoflow/types";

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised/75 px-5 py-4 shadow-sm backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function SummaryCards({ rows }: { rows: ControlExecutionRecord[] }) {
  const total = rows.length;
  const byStatus = rows.reduce(
    (acc, r) => {
      const s = getOperatorStatus(r);
      acc[s] += 1;
      return acc;
    },
    { SUCCESS: 0, FAILED: 0, RUNNING: 0 } as Record<
      OperatorExecutionStatus,
      number
    >
  );
  const advisoryUsed = rows.filter((r) => r.advisoryWasUsed).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <Card label="Total shown" value={total} hint="Current page / result set" />
      <Card label="Success" value={byStatus.SUCCESS} hint="Executed, not suppressed" />
      <Card label="Failed / blocked" value={byStatus.FAILED} hint="Suppressed intakes" />
      <Card label="Running / open" value={byStatus.RUNNING} hint="No workflow run" />
      <Card
        label="AIL advisory"
        value={advisoryUsed}
        hint="Across rows shown"
      />
    </div>
  );
}
