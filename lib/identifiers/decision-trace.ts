import type { DecisionVisibilityResponse } from "@/lib/api/decision-visibility";

/** SignalForge `Signal` id from decision visibility (additive field or legacy correlationId). */
export function signalEntityIdFromDecision(d: DecisionVisibilityResponse): string | null {
  const v = d.trace.signalEntityId ?? d.trace.correlationId;
  return v?.trim() ? v : null;
}

/** SignalForge `Alert` id from decision visibility (additive field or legacy executionId). */
export function alertEntityIdFromDecision(d: DecisionVisibilityResponse): string | null {
  const v = d.trace.alertEntityId ?? d.trace.executionId;
  return v?.trim() ? v : null;
}
