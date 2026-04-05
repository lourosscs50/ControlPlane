import type { OperatorExecutionStatus } from "@/lib/operator/execution-status";

const styles: Record<
  OperatorExecutionStatus,
  { className: string; label: string }
> = {
  SUCCESS: {
    label: "SUCCESS",
    className:
      "bg-emerald-950/90 text-emerald-100 ring-emerald-700/80 border-emerald-700/40",
  },
  FAILED: {
    label: "FAILED",
    className:
      "bg-rose-950/90 text-rose-100 ring-rose-700/80 border-rose-700/40",
  },
  RUNNING: {
    label: "RUNNING",
    className:
      "bg-amber-950/90 text-amber-100 ring-amber-700/80 border-amber-700/40 animate-pulse",
  },
};

export function StatusBadge({ status }: { status: OperatorExecutionStatus }) {
  const cfg = styles[status];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide ring-1 ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
