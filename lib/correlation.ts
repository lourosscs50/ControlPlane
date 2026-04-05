import type { ControlExecutionRecord } from "@/lib/chronoflow/types";
import { operatorTraceHubPathForAlert } from "@/lib/identifiers/cross-system";

/**
 * ChronoFlow `alertId` = SignalForge alert aggregate id (shared cross-system key
 * for the ControlPlane trace hub). Not a W3C trace thread id.
 */
export function chronoFlowLinkedAlertEntityId(row: ControlExecutionRecord): string {
  return row.alertId;
}

/**
 * @deprecated Use {@link chronoFlowLinkedAlertEntityId} — name implied generic correlation.
 */
export function executionCorrelationId(row: ControlExecutionRecord): string {
  return chronoFlowLinkedAlertEntityId(row);
}

/**
 * URL for the ControlPlane trace hub. The argument MUST be the SignalForge **alert
 * entity id** (matches ChronoFlow `alertId`). Do not pass a ChronoFlow execution id
 * or a W3C trace id here.
 *
 * @deprecated Prefer {@link operatorTraceHubPathForAlert} for new code (same behavior).
 */
export function tracePath(alertEntityId: string): string {
  return operatorTraceHubPathForAlert(alertEntityId);
}

export { operatorTraceHubPathForAlert } from "@/lib/identifiers/cross-system";
