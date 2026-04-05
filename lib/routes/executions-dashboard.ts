import type { OperatorStatusFilter } from "@/lib/operator/dashboard-params";

/**
 * Builds executions dashboard URLs (`/`) for analytics drill-down.
 * Uses the same query param names as `buildDashboardHref` / `parseDashboardParams`.
 */
export type ExecutionsDashboardDrillParams = {
  status?: OperatorStatusFilter;
  from?: string;
  to?: string;
};

export function executionsDashboardHref(
  params: ExecutionsDashboardDrillParams
): string {
  const qs = new URLSearchParams();
  const status = params.status;
  if (status && status !== "all") qs.set("status", status);
  if (params.from?.trim()) qs.set("from", params.from.trim());
  if (params.to?.trim()) qs.set("to", params.to.trim());
  const s = qs.toString();
  return s ? `/?${s}` : "/";
}

/** Maps aggregate bucket keys from `executionStatusDistribution` to dashboard status filter. */
export function dashboardStatusFromBucketKey(
  key: string
): OperatorStatusFilter | null {
  switch (key) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "failed";
    case "RUNNING":
      return "running";
    default:
      return null;
  }
}
