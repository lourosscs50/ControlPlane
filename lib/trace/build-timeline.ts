import type { DecisionVisibilityResponse } from "@/lib/api/decision-visibility";
import type { ControlExecutionRecord } from "@/lib/chronoflow/types";
import type { AlertDetailResponse } from "@/lib/api/signalforge";

/** Owning system for the row; advisory snapshots are attributed to ChronoFlow (persisted there). */
export type TraceSourceSystem = "chronoflow" | "signalforge" | "ail";

/** Visual lane for dot color — not a second timeline system. */
export type TimelineCategory =
  | "execution"
  | "signal"
  | "alert"
  | "advisory"
  | "decision"
  | "intelligence";

export type TimelineNavigation =
  | { kind: "execution"; executionInstanceId: string }
  /** Trace hub route keyed by SignalForge alert id (ChronoFlow `alertId`). */
  | { kind: "alertTraceHub"; alertEntityId: string }
  | { kind: "decision"; decisionId: string }
  | { kind: "ailExecution"; executionInstanceId: string };

/**
 * Single cross-system trace row: backend-owned timestamps and summaries only;
 * identifiers are echoed for operator clarity, not reinterpreted.
 */
export type TimelineEvent = {
  id: string;
  sourceSystem: TraceSourceSystem;
  category: TimelineCategory;
  /** Stable machine tag, e.g. chronoflow.execution.received */
  eventType: string;
  atUtc: string;
  title: string;
  summary: string;
  /** Distributed trace thread when the source record exposes `traceId`. */
  traceThreadId?: string | null;
  /** Short secondary line for explicit grouping ids (e.g. API field names). */
  correlationLabel?: string | null;
  navigation?: TimelineNavigation;
};

function ts(iso: string): number {
  const n = new Date(iso).getTime();
  return Number.isFinite(n) ? n : 0;
}

function pushEv(out: TimelineEvent[], e: TimelineEvent) {
  out.push(e);
}

function correlationLabelFromDecision(d: DecisionVisibilityResponse): string | null {
  const c = d.trace.correlationId?.trim();
  if (!c) return null;
  return `SignalForge correlationId (signal entity): ${c}`;
}

/**
 * Merge ChronoFlow executions, SignalForge alert/signal/decision rows, optional A.I.L.
 * execution visibility rows, and ChronoFlow-persisted advisory snapshots into one ordered list.
 *
 * A.I.L. rows are included only when `trace.chronoFlowExecutionInstanceId` matches a ChronoFlow
 * execution id in `executions` (explicit cross-system link from the A.I.L. read model).
 */
export function buildCrossSystemTimeline(
  executions: ControlExecutionRecord[],
  alert: AlertDetailResponse | null,
  decisions: DecisionVisibilityResponse[] = [],
  ailLinkedDecisions: DecisionVisibilityResponse[] = []
): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  const alertEntityIdForHub = alert?.id ?? executions[0]?.alertId ?? null;
  const executionIdSet = new Set(executions.map((e) => e.id));

  for (const ex of executions) {
    pushEv(out, {
      id: `ex-${ex.id}-received`,
      sourceSystem: "chronoflow",
      category: "execution",
      eventType: "chronoflow.execution.received",
      atUtc: ex.receivedAtUtc,
      title: "Execution received",
      summary: `${ex.id} · ${ex.lifecycleEventType} · status ${ex.currentStatus}`,
      navigation: { kind: "execution", executionInstanceId: ex.id },
    });
    if (ex.executedAtUtc) {
      pushEv(out, {
        id: `ex-${ex.id}-executed`,
        sourceSystem: "chronoflow",
        category: "execution",
        eventType: "chronoflow.execution.completed",
        atUtc: ex.executedAtUtc,
        title: "Execution completed",
        summary: ex.wasExecuted
          ? `Ran (${ex.executedStepCount} steps)`
          : "Recorded completion without run",
        navigation: { kind: "execution", executionInstanceId: ex.id },
      });
    }
    if (ex.advisoryWasUsed) {
      const at = ex.executedAtUtc ?? ex.receivedAtUtc;
      pushEv(out, {
        id: `adv-${ex.id}`,
        sourceSystem: "chronoflow",
        category: "advisory",
        eventType: "chronoflow.advisory.snapshot",
        atUtc: at,
        title: "A.I.L. advisory (ChronoFlow snapshot)",
        summary: [
          ex.advisoryStrategyKey
            ? `Strategy: ${ex.advisoryStrategyKey}`
            : "Strategy: —",
          ex.advisoryConfidence
            ? `Confidence: ${ex.advisoryConfidence}`
            : "Confidence: —",
          ex.advisoryReasonSummary ? `Reason: ${ex.advisoryReasonSummary}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        correlationLabel:
          "Outcome persisted on ChronoFlow; not a live A.I.L. execution fetch.",
        navigation: { kind: "execution", executionInstanceId: ex.id },
      });
    }
  }

  if (alert?.signal && alertEntityIdForHub) {
    const s = alert.signal;
    pushEv(out, {
      id: `sig-${s.id}`,
      sourceSystem: "signalforge",
      category: "signal",
      eventType: "signalforge.signal.observed",
      atUtc: s.occurredAtUtc,
      title: `Signal: ${s.type}`,
      summary: `Source ${s.source}${s.value != null ? ` · value ${s.value}` : ""}`,
      navigation: { kind: "alertTraceHub", alertEntityId: alertEntityIdForHub },
    });
  }

  if (alert && alertEntityIdForHub) {
    pushEv(out, {
      id: `alert-created-${alert.id}`,
      sourceSystem: "signalforge",
      category: "alert",
      eventType: "signalforge.alert.created",
      atUtc: alert.createdAtUtc,
      title: `Alert fired · ${alert.rule.name}`,
      summary: `Match: ${alert.rule.matchValue} · status ${alert.currentStatus}`,
      navigation: { kind: "alertTraceHub", alertEntityId: alertEntityIdForHub },
    });
    if (alert.acknowledgedAtUtc) {
      pushEv(out, {
        id: `alert-ack-${alert.id}`,
        sourceSystem: "signalforge",
        category: "alert",
        eventType: "signalforge.alert.acknowledged",
        atUtc: alert.acknowledgedAtUtc,
        title: "Alert acknowledged",
        summary: alert.isResolved
          ? "Acknowledged (may later resolve)"
          : "Acknowledged — still open",
        navigation: { kind: "alertTraceHub", alertEntityId: alertEntityIdForHub },
      });
    }
    if (alert.resolvedAtUtc) {
      pushEv(out, {
        id: `alert-res-${alert.id}`,
        sourceSystem: "signalforge",
        category: "alert",
        eventType: "signalforge.alert.resolved",
        atUtc: alert.resolvedAtUtc,
        title: "Alert resolved",
        summary: "Resolved in SignalForge",
        navigation: { kind: "alertTraceHub", alertEntityId: alertEntityIdForHub },
      });
    }
  }

  for (const dec of decisions) {
    const summary =
      dec.output?.resultSummary?.trim() || dec.decisionType;
    pushEv(out, {
      id: `decision-sf-${dec.decisionId}`,
      sourceSystem: "signalforge",
      category: "decision",
      eventType: "signalforge.decision.visibility",
      atUtc: dec.occurredAtUtc,
      title: `Decision · ${dec.decisionType}`,
      summary,
      traceThreadId: dec.trace.traceId?.trim() || null,
      correlationLabel: correlationLabelFromDecision(dec),
      navigation: { kind: "decision", decisionId: dec.decisionId },
    });
  }

  for (const dec of ailLinkedDecisions) {
    const cf = dec.trace.chronoFlowExecutionInstanceId?.trim();
    if (!cf || !executionIdSet.has(cf)) continue;

    const summary =
      dec.output?.resultSummary?.trim() || dec.decisionType;
    pushEv(out, {
      id: `decision-ail-${dec.decisionId}`,
      sourceSystem: "ail",
      category: "intelligence",
      eventType: "ail.execution.visibility",
      atUtc: dec.occurredAtUtc,
      title: `A.I.L. execution · ${dec.decisionType}`,
      summary,
      traceThreadId: dec.trace.traceId?.trim() || null,
      correlationLabel: dec.trace.correlationId
        ? `A.I.L. correlation group: ${dec.trace.correlationId}`
        : null,
      navigation: { kind: "ailExecution", executionInstanceId: dec.decisionId },
    });
  }

  out.sort((a, b) => {
    const d = ts(a.atUtc) - ts(b.atUtc);
    return d !== 0 ? d : a.id.localeCompare(b.id);
  });
  return out;
}
