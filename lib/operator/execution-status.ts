import type { ControlExecutionRecord } from "@/lib/chronoflow/types";

/**
 * Operator-facing status for control execution rows (visualization only).
 * Derived from ChronoFlow flags — not a persisted workflow engine state.
 */
export type OperatorExecutionStatus = "SUCCESS" | "FAILED" | "RUNNING";

export function getOperatorStatus(
  row: ControlExecutionRecord
): OperatorExecutionStatus {
  if (row.wasSuppressed) return "FAILED";
  if (row.wasExecuted) return "SUCCESS";
  return "RUNNING";
}

export function statusSortOrder(s: OperatorExecutionStatus): number {
  switch (s) {
    case "SUCCESS":
      return 0;
    case "RUNNING":
      return 1;
    case "FAILED":
      return 2;
    default:
      return 9;
  }
}
