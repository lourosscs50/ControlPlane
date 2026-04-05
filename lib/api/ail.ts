import { getAilConfig } from "@/lib/env";
import type { DecisionVisibilityResponse } from "./decision-visibility";
import { ControlPlaneApiError } from "./errors";
import type { PagedResult } from "./signalforge";

function buildHeaders(apiKey: string | undefined): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };
  if (apiKey) h["X-Api-Key"] = apiKey;
  return h;
}

async function readErrorBody(res: Response): Promise<string | undefined> {
  return res.text().catch(() => undefined);
}

/**
 * Read-only snapshot: A.I.L. GET /executions/{id} returns the same decision visibility envelope
 * as execute-intelligence `decisionVisibility` (SignalForge-aligned shape).
 */
export async function getAilExecutionDecisionVisibility(
  executionInstanceId: string
): Promise<DecisionVisibilityResponse | null> {
  const { baseUrl, apiKey } = getAilConfig();
  if (!baseUrl) {
    throw new ControlPlaneApiError(
      "AIL_API_BASE_URL is not configured.",
      "ail",
      0
    );
  }

  const res = await fetch(
    `${baseUrl}/executions/${encodeURIComponent(executionInstanceId)}`,
    { headers: buildHeaders(apiKey), cache: "no-store" }
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new ControlPlaneApiError(
      `A.I.L. execution visibility failed (${res.status})`,
      "ail",
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as DecisionVisibilityResponse;
}

/**
 * Read-only paged list: A.I.L. GET /executions returns the same decision visibility items
 * as single-row GET /executions/{id}, newest completion time first.
 */
export async function listAilExecutionDecisions(
  page: number,
  pageSize: number
): Promise<PagedResult<DecisionVisibilityResponse> | null> {
  const { baseUrl, apiKey } = getAilConfig();
  if (!baseUrl) {
    throw new ControlPlaneApiError(
      "AIL_API_BASE_URL is not configured.",
      "ail",
      0
    );
  }

  const p = page >= 1 ? page : 1;
  const ps = Math.min(100, Math.max(1, pageSize));
  const res = await fetch(
    `${baseUrl}/executions?page=${p}&pageSize=${ps}`,
    { headers: buildHeaders(apiKey), cache: "no-store" }
  );

  if (res.status === 401 || res.status === 403) return null;

  if (!res.ok) {
    throw new ControlPlaneApiError(
      `A.I.L. execution list failed (${res.status})`,
      "ail",
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as PagedResult<DecisionVisibilityResponse>;
}

export function getAilObservabilityNote(): string {
  return "Advisory strategy, confidence, and reason shown on this trace come from ChronoFlow execution snapshots (A.I.L. advises; ChronoFlow persists the outcome).";
}
