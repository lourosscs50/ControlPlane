/**
 * Canonical decision visibility JSON shape (camelCase) shared by SignalForge and A.I.L.
 * Reference: SignalForge Decision Visibility Layer; A.I.L. converged to the same envelope.
 *
 * Additive A.I.L. fields:
 * - trace.executionInstanceId — A.I.L. invocation id (distinct from legacy trace.executionId meaning).
 * - executionExtension — bounded prompt/memory/reliability metadata (A.I.L. only; omit on SignalForge).
 */

export type DecisionExplanationSummary = {
  explanationAvailable: boolean;
  summaryText: string | null;
  reasonCodes: string[] | null;
  confidenceBand: string | null;
  fallbackUsageCount: number | null;
  retryUsageCount: number | null;
};

export type DecisionTraceSummary = {
  /** SignalForge: legacy filter param; often signal entity id. A.I.L.: optional workflow / grouping id (not a signal id). */
  correlationId: string | null;
  /** SignalForge legacy: alert entity id. A.I.L.: unused (null). */
  executionId: string | null;
  /** Cross-system trace thread when propagated. */
  traceId: string | null;
  relatedEntityIds: string[];
  signalEntityId?: string | null;
  alertEntityId?: string | null;
  chronoFlowExecutionInstanceId?: string | null;
  /** Additive: A.I.L. execution invocation id (GET /executions/{id}). */
  executionInstanceId?: string | null;
};

export type ExecutionPromptFacet = {
  promptKey: string;
  promptVersion: string | null;
  resolutionSucceeded: boolean;
};

export type ExecutionMemoryFacet = {
  memoryRequested: boolean;
  memoryItemCount: number | null;
  participationSummary: string | null;
};

export type ExecutionReliabilityFacet = {
  fallbackUsed: boolean;
  policyKey: string | null;
  strategyKey: string | null;
  primaryProviderKey: string;
  primaryModelKey: string;
  selectedProviderKey: string | null;
  selectedModelKey: string | null;
  fallbackProviderKey: string | null;
  fallbackModelKey: string | null;
};

/** Bounded A.I.L.-only extension; safe operator fields only (no prompt bodies / raw memory). */
export type ExecutionVisibilityExtension = {
  prompt: ExecutionPromptFacet;
  memory: ExecutionMemoryFacet;
  reliability: ExecutionReliabilityFacet;
  safeErrorSummary: string | null;
  startedAtUtc: string;
};

export type DecisionVisibilityResponse = {
  decisionId: string;
  decisionCategory: string;
  decisionType: string;
  occurredAtUtc: string;
  status: string;
  input: { normalizedSummary: string };
  output: { resultSummary: string };
  policyProfileKey: string | null;
  strategyPathKey: string | null;
  providerModelSummary: string | null;
  explanation: DecisionExplanationSummary;
  recommendedDownstreamSummary: string | null;
  auditActorUserId: string | null;
  trace: DecisionTraceSummary;
  executionExtension?: ExecutionVisibilityExtension | null;
};
