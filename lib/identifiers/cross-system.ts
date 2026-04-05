/**
 * Cross-system identifier semantics (read-only / ControlPlane).
 *
 * ControlPlane does not mint these ids; it reflects what backends expose.
 *
 * - **traceThreadId** (`traceId` on SignalForge decision rows): distributed trace
 *   thread when gateways propagate W3C (or equivalent) trace context. Often absent.
 * - **correlationId** (SignalForge decision API / DB legacy name): persisted filter
 *   field currently holding the **SignalForge signal entity id** — not a platform-wide
 *   correlation group id until unified upstream.
 * - **executionId** (SignalForge decision API / DB legacy name): persisted filter
 *   field currently holding the **SignalForge alert entity id** — not ChronoFlow’s
 *   execution instance id.
 * - **chronoFlowExecutionInstanceId**: ChronoFlow control execution row id (`executions[].id`).
 * - **alertEntityId** / **signalEntityId**: explicit SignalForge aggregate ids on
 *   decision visibility (additive contract fields).
 * - **relatedEntityIds**: other linked domain ids (alert, rule, signal) for navigation.
 */

/** ChronoFlow execution instance detail in ControlPlane (concrete run record). */
export function chronoFlowExecutionDetailPath(executionInstanceId: string): string {
  return `/executions/${encodeURIComponent(executionInstanceId)}`;
}

/**
 * ControlPlane “trace hub” page: merges ChronoFlow + SignalForge read models.
 * The path parameter MUST be the **SignalForge alert entity id** (same value as
 * ChronoFlow `alertId` on execution records). This is not a W3C trace thread id.
 */
export function operatorTraceHubPathForAlert(alertEntityId: string): string {
  return `/trace/${encodeURIComponent(alertEntityId)}`;
}
