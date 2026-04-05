import { getSignalForgeConfig } from "@/lib/env";
import type { DecisionVisibilityResponse } from "./decision-visibility";
import { ControlPlaneApiError } from "./errors";

export type {
  DecisionExplanationSummary,
  DecisionTraceSummary,
  DecisionVisibilityResponse,
} from "./decision-visibility";

/** Mirrors SignalForge alert list/detail JSON (camelCase). */
export type AlertRuleSummary = {
  id: string;
  name: string;
  ruleType: string;
  matchValue: string;
  isActive: boolean;
  isArchived: boolean;
  createdAtUtc: string;
};

export type AlertSignalSummary = {
  id: string;
  source: string;
  type: string;
  value: number | null;
  occurredAtUtc: string;
};

export type AlertDetailResponse = {
  id: string;
  signalId: string;
  ruleId: string;
  createdAtUtc: string;
  isAcknowledged: boolean;
  acknowledgedAtUtc: string | null;
  acknowledgedByUserId: string | null;
  isResolved: boolean;
  resolvedAtUtc: string | null;
  resolvedByUserId: string | null;
  reopenedAtUtc: string | null;
  reopenedByUserId: string | null;
  timeToAcknowledgeSeconds: number | null;
  timeToResolveSeconds: number | null;
  hasBeenReopened: boolean;
  currentStatus: string;
  ageSeconds: number;
  rule: AlertRuleSummary;
  signal: AlertSignalSummary;
};

export type AlertResponse = {
  id: string;
  signalId: string;
  ruleId: string;
  createdAtUtc: string;
  isAcknowledged: boolean;
  acknowledgedAtUtc: string | null;
  acknowledgedByUserId: string | null;
  isResolved: boolean;
  resolvedAtUtc: string | null;
  resolvedByUserId: string | null;
  reopenedAtUtc: string | null;
  reopenedByUserId: string | null;
  timeToAcknowledgeSeconds: number | null;
  timeToResolveSeconds: number | null;
  hasBeenReopened: boolean;
  currentStatus: string;
  ageSeconds: number;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type AlertMetricsSummaryResponse = {
  totalAlerts: number;
  openAlerts: number;
  acknowledgedUnresolvedAlerts: number;
  resolvedAlerts: number;
  reopenedAlerts: number;
  averageTimeToAcknowledgeSeconds: number | null;
  averageTimeToResolveSeconds: number | null;
};

function sfHeaders(extra?: HeadersInit): HeadersInit {
  const { apiToken } = getSignalForgeConfig();
  const h: Record<string, string> = { Accept: "application/json" };
  if (apiToken) h.Authorization = `Bearer ${apiToken}`;
  return { ...h, ...extra };
}

async function readErrorBody(res: Response): Promise<string | undefined> {
  return res.text().catch(() => undefined);
}

export async function getAlertDetail(
  alertId: string
): Promise<AlertDetailResponse | null> {
  const { baseUrl } = getSignalForgeConfig();
  if (!baseUrl) {
    throw new ControlPlaneApiError(
      "SIGNALFORGE_API_BASE_URL is not configured.",
      "signalforge",
      0
    );
  }

  const res = await fetch(`${baseUrl}/alerts/${encodeURIComponent(alertId)}`, {
    headers: sfHeaders(),
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new ControlPlaneApiError(
      `SignalForge alert detail failed (${res.status})`,
      "signalforge",
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as AlertDetailResponse;
}

export type AlertListParams = {
  page?: number;
  pageSize?: number;
  ruleId?: string;
  signalId?: string;
  fromCreatedUtc?: string;
  toCreatedUtc?: string;
  isAcknowledged?: boolean;
  isResolved?: boolean;
};

export async function listAlerts(
  params: AlertListParams
): Promise<PagedResult<AlertResponse>> {
  const { baseUrl } = getSignalForgeConfig();
  if (!baseUrl) {
    throw new ControlPlaneApiError(
      "SIGNALFORGE_API_BASE_URL is not configured.",
      "signalforge",
      0
    );
  }

  const qs = new URLSearchParams();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 100;
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  if (params.ruleId) qs.set("ruleId", params.ruleId);
  if (params.signalId) qs.set("signalId", params.signalId);
  if (params.fromCreatedUtc) qs.set("fromCreatedUtc", params.fromCreatedUtc);
  if (params.toCreatedUtc) qs.set("toCreatedUtc", params.toCreatedUtc);
  if (params.isAcknowledged !== undefined) {
    qs.set("isAcknowledged", String(params.isAcknowledged));
  }
  if (params.isResolved !== undefined) {
    qs.set("isResolved", String(params.isResolved));
  }

  const url = `${baseUrl}/alerts${qs.toString() ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: sfHeaders(), cache: "no-store" });

  if (!res.ok) {
    throw new ControlPlaneApiError(
      `SignalForge alert list failed (${res.status})`,
      "signalforge",
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as PagedResult<AlertResponse>;
}

/** Global metrics snapshot — requires JWT on SignalForge. */
export async function getAlertMetrics(): Promise<AlertMetricsSummaryResponse | null> {
  const { baseUrl, apiToken } = getSignalForgeConfig();
  if (!baseUrl) {
    throw new ControlPlaneApiError(
      "SIGNALFORGE_API_BASE_URL is not configured.",
      "signalforge",
      0
    );
  }

  if (!apiToken) return null;

  const res = await fetch(`${baseUrl}/alerts/metrics`, {
    headers: sfHeaders(),
    cache: "no-store",
  });

  if (res.status === 401) return null;

  if (!res.ok) {
    throw new ControlPlaneApiError(
      `SignalForge metrics failed (${res.status})`,
      "signalforge",
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as AlertMetricsSummaryResponse;
}

/** Fetch all alerts matching filters up to a safety cap (read aggregation only). */
export async function listAllAlertsBounded(
  params: Omit<AlertListParams, "page"> & { pageSize?: number },
  maxItems: number
): Promise<AlertResponse[]> {
  const pageSize = Math.min(params.pageSize ?? 100, 200);
  const out: AlertResponse[] = [];
  let page = 1;

  while (out.length < maxItems) {
    const batch = await listAlerts({ ...params, page, pageSize });
    out.push(...batch.items);
    if (batch.items.length === 0 || out.length >= batch.totalCount) break;
    page += 1;
    if (page > 100) break;
  }

  return out.slice(0, maxItems);
}

// --- Decision visibility (SignalForge GET /decisions, JWT) ---

export type DecisionListParams = {
  page?: number;
  pageSize?: number;
  decisionCategory?: string;
  decisionType?: string;
  status?: string;
  fromOccurredUtc?: string;
  toOccurredUtc?: string;
  correlationId?: string;
  traceId?: string;
  executionId?: string;
  ruleId?: string;
  policyProfileKey?: string;
};

export type DecisionVisibilityMetricsResponse = {
  totalDecisions: number;
  countsByDecisionType: { decisionType: string; count: number }[];
};

export async function getDecision(
  id: string
): Promise<DecisionVisibilityResponse | null> {
  const { baseUrl, apiToken } = getSignalForgeConfig();
  if (!baseUrl) {
    throw new ControlPlaneApiError(
      "SIGNALFORGE_API_BASE_URL is not configured.",
      "signalforge",
      0
    );
  }
  if (!apiToken) return null;

  const res = await fetch(
    `${baseUrl}/decisions/${encodeURIComponent(id)}`,
    { headers: sfHeaders(), cache: "no-store" }
  );

  if (res.status === 404) return null;
  if (res.status === 401) return null;

  if (!res.ok) {
    throw new ControlPlaneApiError(
      `SignalForge decision detail failed (${res.status})`,
      "signalforge",
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as DecisionVisibilityResponse;
}

export async function listDecisions(
  params: DecisionListParams
): Promise<PagedResult<DecisionVisibilityResponse> | null> {
  const { baseUrl, apiToken } = getSignalForgeConfig();
  if (!baseUrl) {
    throw new ControlPlaneApiError(
      "SIGNALFORGE_API_BASE_URL is not configured.",
      "signalforge",
      0
    );
  }
  if (!apiToken) return null;

  const qs = new URLSearchParams();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  if (params.decisionCategory)
    qs.set("decisionCategory", params.decisionCategory);
  if (params.decisionType) qs.set("decisionType", params.decisionType);
  if (params.status) qs.set("status", params.status);
  if (params.fromOccurredUtc)
    qs.set("fromOccurredUtc", params.fromOccurredUtc);
  if (params.toOccurredUtc) qs.set("toOccurredUtc", params.toOccurredUtc);
  if (params.correlationId) qs.set("correlationId", params.correlationId);
  if (params.traceId) qs.set("traceId", params.traceId);
  if (params.executionId) qs.set("executionId", params.executionId);
  if (params.ruleId) qs.set("ruleId", params.ruleId);
  if (params.policyProfileKey)
    qs.set("policyProfileKey", params.policyProfileKey);

  const url = `${baseUrl}/decisions?${qs}`;
  const res = await fetch(url, { headers: sfHeaders(), cache: "no-store" });

  if (res.status === 401) return null;

  if (!res.ok) {
    throw new ControlPlaneApiError(
      `SignalForge decision list failed (${res.status})`,
      "signalforge",
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as PagedResult<DecisionVisibilityResponse>;
}

export async function getDecisionMetrics(): Promise<DecisionVisibilityMetricsResponse | null> {
  const { baseUrl, apiToken } = getSignalForgeConfig();
  if (!baseUrl) {
    throw new ControlPlaneApiError(
      "SIGNALFORGE_API_BASE_URL is not configured.",
      "signalforge",
      0
    );
  }
  if (!apiToken) return null;

  const res = await fetch(`${baseUrl}/decisions/metrics`, {
    headers: sfHeaders(),
    cache: "no-store",
  });

  if (res.status === 401) return null;

  if (!res.ok) {
    throw new ControlPlaneApiError(
      `SignalForge decision metrics failed (${res.status})`,
      "signalforge",
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as DecisionVisibilityMetricsResponse;
}
