import { getChronoFlowConfig } from "@/lib/env";
import type { ControlExecutionRecord, ExecutionListQuery } from "@/lib/chronoflow/types";
import { executionListToSearchParams } from "@/lib/chronoflow/query-builders";

export class ChronoFlowApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: string
  ) {
    super(message);
    this.name = "ChronoFlowApiError";
  }
}

function buildHeaders(apiKey: string | undefined): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };
  if (apiKey) h["X-Api-Key"] = apiKey;
  return h;
}

export async function listExecutions(
  query: ExecutionListQuery
): Promise<ControlExecutionRecord[]> {
  const { baseUrl, apiKey } = getChronoFlowConfig();
  if (!baseUrl) {
    throw new ChronoFlowApiError(
      "CHRONOFLOW_API_BASE_URL is not configured.",
      0
    );
  }

  const qs = executionListToSearchParams({
    ...query,
    take: query.take ?? 100,
    skip: query.skip ?? 0,
  });
  const url = `${baseUrl}/control/executions${qs.toString() ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    headers: buildHeaders(apiKey),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ChronoFlowApiError(
      `ChronoFlow list failed (${res.status})`,
      res.status,
      text
    );
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new ChronoFlowApiError("Invalid response: expected array", res.status);
  }

  return data as ControlExecutionRecord[];
}

export async function getExecutionById(
  id: string
): Promise<ControlExecutionRecord | null> {
  const { baseUrl, apiKey } = getChronoFlowConfig();
  if (!baseUrl) {
    throw new ChronoFlowApiError(
      "CHRONOFLOW_API_BASE_URL is not configured.",
      0
    );
  }

  const url = `${baseUrl}/control/executions/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    headers: buildHeaders(apiKey),
    cache: "no-store",
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ChronoFlowApiError(
      `ChronoFlow detail failed (${res.status})`,
      res.status,
      text
    );
  }

  return (await res.json()) as ControlExecutionRecord;
}
