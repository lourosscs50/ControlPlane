import type { ExecutionListQuery } from "./types";

export function executionListToSearchParams(q: ExecutionListQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.alertId?.trim()) p.set("alertId", q.alertId.trim());
  if (q.lifecycleEventType?.trim()) p.set("lifecycleEventType", q.lifecycleEventType.trim());
  if (q.wasExecuted !== undefined) p.set("wasExecuted", String(q.wasExecuted));
  if (q.wasSuppressed !== undefined) p.set("wasSuppressed", String(q.wasSuppressed));
  if (q.workflowKey?.trim()) p.set("workflowKey", q.workflowKey.trim());
  if (q.skip !== undefined) p.set("skip", String(q.skip));
  if (q.take !== undefined) p.set("take", String(q.take));
  return p;
}

export function parseExecutionListQuery(
  raw: Record<string, string | string[] | undefined>
): ExecutionListQuery {
  const pick = (k: string) => {
    const v = raw[k];
    return typeof v === "string" ? v : undefined;
  };
  const out: ExecutionListQuery = {};

  const alertId = pick("alertId");
  if (alertId) out.alertId = alertId;

  const lifecycleEventType = pick("lifecycleEventType");
  if (lifecycleEventType) out.lifecycleEventType = lifecycleEventType;

  const wasExecuted = pick("wasExecuted");
  if (wasExecuted === "true") out.wasExecuted = true;
  else if (wasExecuted === "false") out.wasExecuted = false;

  const wasSuppressed = pick("wasSuppressed");
  if (wasSuppressed === "true") out.wasSuppressed = true;
  else if (wasSuppressed === "false") out.wasSuppressed = false;

  const workflowKey = pick("workflowKey");
  if (workflowKey) out.workflowKey = workflowKey;

  const skip = pick("skip");
  if (skip && /^\d+$/.test(skip)) out.skip = Number(skip);

  const take = pick("take");
  if (take && /^\d+$/.test(take)) out.take = Number(take);

  return out;
}
