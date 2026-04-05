import type { DecisionVisibilityResponse } from "@/lib/api/decision-visibility";
import type { DecisionTraceSemantics } from "@/lib/operator/decision-trace-semantics";
import {
  alertEntityIdFromDecision,
  signalEntityIdFromDecision,
} from "@/lib/identifiers/decision-trace";
import { decisionsListForSignalEntity } from "@/lib/identifiers/signalforge-decisions";
import {
  ailExecutionDetailPath,
  decisionsListPath,
  executionDetailPath,
} from "@/lib/routes/operator";
import { operatorTraceHubPathForAlert } from "@/lib/identifiers/cross-system";

/** Single navigation target; href uses explicit ids from the visibility envelope only. */
export type DecisionInsightNavLink = {
  label: string;
  href: string;
  /** Shown under the link when we need to qualify semantics */
  qualifierNote?: string;
};

export type DecisionInsightInfluenceRow = {
  label: string;
  value: string;
  /** Operator hint — not a causal claim */
  note?: string;
};

export type DecisionInsightMissingItem = {
  label: string;
  detail: string;
};

/**
 * Read-only view model for operator intelligence UI. All strings are echoed from the visibility
 * envelope or fixed operator copy — no client-side inference of business outcomes.
 */
export type DecisionInsightViewModel = {
  traceSemantics: DecisionTraceSemantics;
  outcome: {
    decisionType: string;
    decisionCategory: string;
    status: string;
    occurredAtUtc: string;
    decisionId: string;
    resultSummary: string;
  };
  insightSummary: {
    explanationAvailable: boolean;
    summaryText: string | null;
    reasonCodes: string[] | null;
    recommendedDownstream: string | null;
  };
  influences: DecisionInsightInfluenceRow[];
  alternatives: {
    exposedByApi: false;
    message: string;
  };
  debug: {
    confidenceBand: string | null;
    fallbackUsageCount: number | null;
    retryUsageCount: number | null;
    /** A.I.L. execution extension only */
    reliabilityFallbackUsed: boolean | null;
    reliabilitySummaryLines: string[];
    safeErrorSummary: string | null;
  };
  missing: DecisionInsightMissingItem[];
  navigation: DecisionInsightNavLink[];
};

function pushMissing(
  out: DecisionInsightMissingItem[],
  label: string,
  detail: string,
  condition: boolean
) {
  if (condition) out.push({ label, detail });
}

/**
 * Maps `DecisionVisibilityResponse` into section-oriented display data. Does not interpret domain rules.
 */
export function buildDecisionInsightViewModel(
  d: DecisionVisibilityResponse,
  traceSemantics: DecisionTraceSemantics
): DecisionInsightViewModel {
  const missing: DecisionInsightMissingItem[] = [];

  const summaryText = d.explanation.summaryText?.trim() || null;
  pushMissing(
    missing,
    "Explanation text",
    "Backend did not provide summaryText (or explanation is marked unavailable).",
    !summaryText && !d.explanation.explanationAvailable
  );
  pushMissing(
    missing,
    "Explanation text",
    "Explanation is marked available but summaryText is empty.",
    d.explanation.explanationAvailable && !summaryText
  );

  const hasReasonCodes = Boolean(d.explanation.reasonCodes?.length);
  pushMissing(
    missing,
    "Reason codes",
    "No reason codes were included in this visibility record.",
    !hasReasonCodes
  );

  const influences: DecisionInsightInfluenceRow[] = [
    {
      label: "Input summary (normalized)",
      value: d.input?.normalizedSummary?.trim() || "—",
      note: "Bounded operator summary from the API — not a raw payload.",
    },
    {
      label: "Policy / profile key",
      value: d.policyProfileKey?.trim() || "—",
    },
    {
      label: "Strategy path key",
      value: d.strategyPathKey?.trim() || "—",
    },
    {
      label: "Provider / model label",
      value: d.providerModelSummary?.trim() || "—",
    },
  ];

  if (d.auditActorUserId?.trim()) {
    influences.push({
      label: "Audit actor (user id)",
      value: d.auditActorUserId.trim(),
    });
  }

  const ext = d.executionExtension;
  if (ext) {
    influences.push(
      {
        label: "Prompt key (registry)",
        value: ext.prompt.promptKey,
        note: "Identifier only — no template body in visibility.",
      },
      {
        label: "Prompt resolved",
        value: ext.prompt.resolutionSucceeded ? "Yes" : "No",
      },
      {
        label: "Memory participation",
        value: ext.memory.participationSummary?.trim() || "—",
        note: "Counts/summary only — no raw memory contents.",
      }
    );
  }

  const debugReliability = ext?.reliability ?? null;
  const reliabilitySummaryLines: string[] = [];
  if (debugReliability) {
    reliabilitySummaryLines.push(
      `Primary: ${debugReliability.primaryProviderKey}/${debugReliability.primaryModelKey}`
    );
    if (debugReliability.selectedProviderKey && debugReliability.selectedModelKey) {
      reliabilitySummaryLines.push(
        `Selected: ${debugReliability.selectedProviderKey}/${debugReliability.selectedModelKey}`
      );
    }
    if (debugReliability.fallbackUsed) {
      if (debugReliability.fallbackProviderKey && debugReliability.fallbackModelKey) {
        reliabilitySummaryLines.push(
          `Fallback: ${debugReliability.fallbackProviderKey}/${debugReliability.fallbackModelKey}`
        );
      } else {
        reliabilitySummaryLines.push("Fallback used (provider/model keys not fully populated).");
      }
    }
  }

  const navigation: DecisionInsightNavLink[] = [];

  const alertId = alertEntityIdFromDecision(d);
  if (alertId && traceSemantics === "signalforge") {
    navigation.push({
      label: "Trace hub (SignalForge alert entity id)",
      href: operatorTraceHubPathForAlert(alertId),
      qualifierNote:
        "Same key as ChronoFlow alertId on executions — not a W3C trace id.",
    });
  }

  const signalId =
    traceSemantics === "signalforge" ? signalEntityIdFromDecision(d) : null;
  if (signalId) {
    navigation.push({
      label: "Decisions for this signal entity id",
      href: decisionsListForSignalEntity(signalId),
      qualifierNote: "SignalForge list filter uses API name correlationId.",
    });
  }

  const traceId = d.trace.traceId?.trim();
  if (traceId) {
    navigation.push({
      label: "Decisions sharing traceId",
      href: decisionsListPath({ traceId, page: 1, pageSize: 50 }),
      qualifierNote: "Filter on distributed trace thread when stored by SignalForge.",
    });
  }

  const cfExec = d.trace.chronoFlowExecutionInstanceId?.trim();
  if (cfExec) {
    navigation.push({
      label: "ChronoFlow execution detail",
      href: executionDetailPath(cfExec),
      qualifierNote: "Only shown when the envelope includes chronoFlowExecutionInstanceId.",
    });
  }

  const ailExec = d.trace.executionInstanceId?.trim();
  const isAilShaped = traceSemantics === "ail" || Boolean(d.executionExtension);
  if (ailExec && isAilShaped) {
    navigation.push({
      label: "A.I.L. execution visibility (this instance)",
      href: ailExecutionDetailPath(ailExec),
      qualifierNote: "decisionId matches A.I.L. execution instance id for this shape.",
    });
  }

  pushMissing(
    missing,
    "Cross-system navigation",
    "No trace hub link: alert entity id not present on this record.",
    traceSemantics === "signalforge" && !alertId
  );

  return {
    traceSemantics,
    outcome: {
      decisionType: d.decisionType,
      decisionCategory: d.decisionCategory,
      status: d.status,
      occurredAtUtc: d.occurredAtUtc,
      decisionId: d.decisionId,
      resultSummary: d.output?.resultSummary?.trim() || "—",
    },
    insightSummary: {
      explanationAvailable: d.explanation.explanationAvailable,
      summaryText,
      reasonCodes: d.explanation.reasonCodes,
      recommendedDownstream: d.recommendedDownstreamSummary?.trim() || null,
    },
    influences,
    alternatives: {
      exposedByApi: false,
      message:
        "The decision visibility API does not expose a list of considered alternatives in this envelope. Only the recorded outcome summary is available above.",
    },
    debug: {
      confidenceBand: d.explanation.confidenceBand,
      fallbackUsageCount: d.explanation.fallbackUsageCount,
      retryUsageCount: d.explanation.retryUsageCount,
      reliabilityFallbackUsed: debugReliability ? debugReliability.fallbackUsed : null,
      reliabilitySummaryLines,
      safeErrorSummary: ext?.safeErrorSummary?.trim() || null,
    },
    missing,
    navigation,
  };
}
