import { chronoFlowExecutionDetailPath } from "@/lib/identifiers/cross-system";

/**
 * Central path builders for operator navigation (read-only).
 * @param executionInstanceId ChronoFlow control execution row id (`id` field).
 */
export function executionDetailPath(executionInstanceId: string): string {
  return chronoFlowExecutionDetailPath(executionInstanceId);
}

export function decisionDetailPath(decisionId: string): string {
  return `/decisions/${encodeURIComponent(decisionId)}`;
}

/** Read-only operations analytics hub (date-range KPIs; not auto-filtered to a single decision). */
export function analyticsOverviewPath(): string {
  return "/analytics";
}

/** A.I.L. execution visibility snapshot (read-only); id is the A.I.L. execution instance id. */
export function ailExecutionDetailPath(executionInstanceId: string): string {
  return `/ail/executions/${encodeURIComponent(executionInstanceId)}`;
}

export type DecisionsListQuery = {
  page?: number;
  pageSize?: number;
  /** Cross-system list: all | signalforge | ail */
  sourceSystem?: string;
  decisionCategory?: string;
  decisionType?: string;
  status?: string;
  fromOccurredUtc?: string;
  toOccurredUtc?: string;
  /** SignalForge wire name; filters by signal entity id (not platform correlation group). */
  correlationId?: string;
  /** Distributed trace thread when SignalForge stores it. */
  traceId?: string;
  /** SignalForge wire name; filters by alert entity id (not ChronoFlow execution instance id). */
  executionId?: string;
  ruleId?: string;
  policyProfileKey?: string;
};

/** GET /decisions with supported filter query string (read-only). */
export function decisionsListPath(query?: DecisionsListQuery): string {
  if (!query) return "/decisions";
  const qs = new URLSearchParams();
  if (query.page != null) qs.set("page", String(query.page));
  if (query.pageSize != null) qs.set("pageSize", String(query.pageSize));
  if (query.sourceSystem) qs.set("sourceSystem", query.sourceSystem);
  if (query.decisionCategory)
    qs.set("decisionCategory", query.decisionCategory);
  if (query.decisionType) qs.set("decisionType", query.decisionType);
  if (query.status) qs.set("status", query.status);
  if (query.fromOccurredUtc) qs.set("fromOccurredUtc", query.fromOccurredUtc);
  if (query.toOccurredUtc) qs.set("toOccurredUtc", query.toOccurredUtc);
  if (query.correlationId) qs.set("correlationId", query.correlationId);
  if (query.traceId) qs.set("traceId", query.traceId);
  if (query.executionId) qs.set("executionId", query.executionId);
  if (query.ruleId) qs.set("ruleId", query.ruleId);
  if (query.policyProfileKey)
    qs.set("policyProfileKey", query.policyProfileKey);
  const s = qs.toString();
  return s ? `/decisions?${s}` : "/decisions";
}
