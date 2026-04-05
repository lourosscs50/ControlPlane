import type { DecisionVisibilityResponse } from "@/lib/api/decision-visibility";
import type { DecisionTraceSemantics } from "@/lib/operator/decision-trace-semantics";
import {
  alertEntityIdFromDecision,
  signalEntityIdFromDecision,
} from "@/lib/identifiers/decision-trace";
import { decisionsListForSignalEntity } from "@/lib/identifiers/signalforge-decisions";
import {
  ailExecutionDetailPath,
  analyticsOverviewPath,
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

/** Operator-facing state chip; `basis` keeps UI honest about grounding. */
export type DecisionInsightStateBadge = {
  label: string;
  basis: "envelope" | "inferred";
  /** Which envelope field(s) support an envelope badge; plain language for inferred. */
  basisNote?: string;
};

export type DecisionInsightSelectedOptionVm =
  | { kind: "not_exposed" }
  | { kind: "explicit_null" }
  | { kind: "explicit_empty" }
  | { kind: "id"; value: string };

export type DecisionInsightTraceIdentifierRow = {
  label: string;
  value: string | null;
  note?: string;
};

export type DecisionInsightDebugTimelineStep = {
  id: string;
  title: string;
  /** What we can say without inventing stages */
  disposition: "reported" | "not_in_envelope" | "reported_empty";
  detail: string;
};

export type DecisionInsightAlternativesVm =
  | {
      mode: "contract_list";
      options: ReadonlyArray<{ optionId: string; summary: string | null }>;
      selectedOptionId: string | null;
    }
  | {
      mode: "not_in_contract";
      message: string;
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
    selectedOption: DecisionInsightSelectedOptionVm;
  };
  traceIdentifiers: DecisionInsightTraceIdentifierRow[];
  insightSummary: {
    explanationAvailable: boolean;
    summaryText: string | null;
    reasonCodes: string[] | null;
    recommendedDownstream: string | null;
    stateBadges: DecisionInsightStateBadge[];
    operatorLines: string[];
  };
  influences: DecisionInsightInfluenceRow[];
  alternatives: DecisionInsightAlternativesVm;
  debug: {
    confidenceBand: string | null;
    fallbackUsageCount: number | null;
    retryUsageCount: number | null;
    /** A.I.L. execution extension only */
    reliabilityFallbackUsed: boolean | null;
    reliabilitySummaryLines: string[];
    safeErrorSummary: string | null;
    timeline: DecisionInsightDebugTimelineStep[];
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

function buildSelectedOptionVm(d: DecisionVisibilityResponse): DecisionInsightSelectedOptionVm {
  if (d.selectedOptionId === undefined) {
    return { kind: "not_exposed" };
  }
  if (d.selectedOptionId === null) {
    return { kind: "explicit_null" };
  }
  const t = d.selectedOptionId.trim();
  if (!t) return { kind: "explicit_empty" };
  return { kind: "id", value: t };
}

function buildAlternativesVm(d: DecisionVisibilityResponse): DecisionInsightAlternativesVm {
  const raw = d.decisionOptions;
  if (raw === undefined) {
    return {
      mode: "not_in_contract",
      message:
        "This visibility contract does not include a decisionOptions array for this record. ControlPlane does not fabricate alternatives or scores.",
    };
  }
  if (raw === null || raw.length === 0) {
    return {
      mode: "contract_list",
      options: [],
      selectedOptionId:
        d.selectedOptionId === undefined || d.selectedOptionId === null
          ? null
          : d.selectedOptionId.trim() || null,
    };
  }
  const options = raw.map((o) => ({
    optionId: String(o.optionId).trim(),
    summary: o.summary?.trim() ?? null,
  }));
  const sel =
    d.selectedOptionId === undefined || d.selectedOptionId === null
      ? null
      : d.selectedOptionId.trim() || null;
  return { mode: "contract_list", options, selectedOptionId: sel };
}

function buildStateBadges(d: DecisionVisibilityResponse): DecisionInsightStateBadge[] {
  const badges: DecisionInsightStateBadge[] = [];
  if (!d.explanation.explanationAvailable) {
    badges.push({
      label: "Explanation unavailable",
      basis: "envelope",
      basisNote: "explanation.explanationAvailable === false",
    });
  }
  const band = d.explanation.confidenceBand?.trim();
  if (band) {
    badges.push({
      label: `Confidence band: ${band}`,
      basis: "envelope",
      basisNote: "explanation.confidenceBand",
    });
  }
  const fb = d.explanation.fallbackUsageCount;
  if (fb != null && fb > 0) {
    badges.push({
      label: "Fallback usage reported",
      basis: "envelope",
      basisNote: "explanation.fallbackUsageCount > 0",
    });
  }
  const rt = d.explanation.retryUsageCount;
  if (rt != null && rt > 0) {
    badges.push({
      label: "Retry observed",
      basis: "envelope",
      basisNote: "explanation.retryUsageCount > 0",
    });
  }
  if (rt === 0) {
    badges.push({
      label: "Retries: none reported (0)",
      basis: "envelope",
      basisNote: "explanation.retryUsageCount === 0",
    });
  }
  if (fb === 0) {
    badges.push({
      label: "Fallback usage count: none reported (0)",
      basis: "envelope",
      basisNote: "explanation.fallbackUsageCount === 0",
    });
  }
  const ext = d.executionExtension;
  if (ext) {
    badges.push({
      label: "A.I.L. execution facets attached",
      basis: "envelope",
      basisNote: "executionExtension present",
    });
    if (ext.safeErrorSummary?.trim()) {
      badges.push({
        label: "Sanitized error summary present",
        basis: "envelope",
        basisNote: "executionExtension.safeErrorSummary",
      });
    }
    if (ext.reliability.fallbackUsed) {
      badges.push({
        label: "Provider fallback used",
        basis: "envelope",
        basisNote: "executionExtension.reliability.fallbackUsed",
      });
    }
  }
  return badges;
}

/** Short operator lines — facts or clearly marked inference; no chain-of-thought. */
function buildOperatorInsightLines(d: DecisionVisibilityResponse): string[] {
  const lines: string[] = [];
  const sel = buildSelectedOptionVm(d);
  if (sel.kind === "id") {
    lines.push(`Recorded selected option id: ${sel.value}.`);
  } else if (sel.kind === "not_exposed") {
    lines.push(
      "No selected-option field on this visibility record — ControlPlane cannot show a discrete selection id."
    );
  } else if (sel.kind === "explicit_null" || sel.kind === "explicit_empty") {
    lines.push("Backend included selectedOptionId but it is empty — no discrete selection id is recorded.");
  }
  if (d.executionExtension) {
    lines.push(
      "A.I.L. execution metadata is present on this row (prompt key, memory participation summary, reliability keys) — advisory/model path data, not a full execution transcript."
    );
  } else {
    lines.push(
      "No A.I.L. executionExtension on this row — provider/memory/reliability facets are not part of this envelope."
    );
  }
  return lines;
}

function buildDebugTimeline(d: DecisionVisibilityResponse): DecisionInsightDebugTimelineStep[] {
  const steps: DecisionInsightDebugTimelineStep[] = [];
  const input = d.input?.normalizedSummary?.trim() ?? "";
  steps.push({
    id: "input",
    title: "Input context",
    disposition: input ? "reported" : "reported_empty",
    detail: input
      ? "normalizedSummary is populated on this visibility row."
      : "normalizedSummary is empty — upstream context may be missing or not summarized here.",
  });

  const ext = d.executionExtension;
  if (ext) {
    steps.push({
      id: "prompt",
      title: "Prompt registry resolution",
      disposition: "reported",
      detail: ext.prompt.resolutionSucceeded
        ? `Prompt key ${ext.prompt.promptKey} resolved (${ext.prompt.promptVersion ? `version ${ext.prompt.promptVersion}` : "no version string"}).`
        : `Prompt key ${ext.prompt.promptKey} did not resolve successfully.`,
    });
    steps.push({
      id: "memory",
      title: "Memory participation",
      disposition: "reported",
      detail: ext.memory.memoryRequested
        ? `Memory requested; item count ${ext.memory.memoryItemCount == null ? "not reported" : String(ext.memory.memoryItemCount)}. Summary: ${ext.memory.participationSummary?.trim() || "—"}.`
        : "Memory not requested for this execution (A.I.L. facet).",
    });
    steps.push({
      id: "provider",
      title: "Provider / model path",
      disposition: "reported",
      detail: `Primary ${ext.reliability.primaryProviderKey}/${ext.reliability.primaryModelKey}${
        ext.reliability.selectedProviderKey && ext.reliability.selectedModelKey
          ? `; selected ${ext.reliability.selectedProviderKey}/${ext.reliability.selectedModelKey}`
          : ""
      }.`,
    });
  } else {
    steps.push({
      id: "ail_facets",
      title: "A.I.L. execution facets",
      disposition: "not_in_envelope",
      detail:
        "No executionExtension — prompt resolution, memory, and reliability steps are not available as structured fields on this record.",
    });
  }

  const rt = d.explanation.retryUsageCount;
  steps.push({
    id: "retry",
    title: "Retries (explanation counters)",
    disposition: rt == null ? "not_in_envelope" : "reported",
    detail:
      rt == null
        ? "explanation.retryUsageCount not reported — unknown vs zero."
        : `retryUsageCount = ${rt}.`,
  });

  const fb = d.explanation.fallbackUsageCount;
  const relFb = d.executionExtension?.reliability?.fallbackUsed;
  const hasRelFacet = d.executionExtension?.reliability != null;
  const hasFallbackEnvelope = fb != null || hasRelFacet;
  steps.push({
    id: "fallback",
    title: "Fallback signals",
    disposition: hasFallbackEnvelope ? "reported" : "not_in_envelope",
    detail: !hasFallbackEnvelope
      ? "No fallback counters in explanation and no reliability facet — not enough data to describe fallback here."
      : relFb === true
        ? "A.I.L. reliability reports fallbackUsed = true."
        : fb != null
          ? `explanation.fallbackUsageCount = ${fb}.`
          : hasRelFacet
            ? `Reliability facet present; fallbackUsed = ${relFb === false ? "false" : String(relFb)}.`
            : "—",
  });

  steps.push({
    id: "result",
    title: "Recorded output",
    disposition: d.output?.resultSummary?.trim() ? "reported" : "reported_empty",
    detail: d.output?.resultSummary?.trim()
      ? "resultSummary is present on this visibility row."
      : "resultSummary is empty.",
  });

  return steps;
}

function formatGuidOrString(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t || null;
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
        label: "Prompt version",
        value: ext.prompt.promptVersion?.trim() || "—",
      },
      {
        label: "Prompt resolved",
        value: ext.prompt.resolutionSucceeded ? "Yes" : "No",
      },
      {
        label: "Memory requested",
        value: ext.memory.memoryRequested ? "Yes" : "No",
      },
      {
        label: "Memory item count",
        value:
          ext.memory.memoryItemCount == null
            ? "Not reported"
            : String(ext.memory.memoryItemCount),
        note: "Count only — no memory item bodies in visibility.",
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

  navigation.push({
    label: "Operations analytics",
    href: analyticsOverviewPath(),
    qualifierNote:
      "Cross-system KPI hub (date range). Does not auto-filter to this decision row.",
  });

  const alertId = alertEntityIdFromDecision(d);
  if (alertId && traceSemantics === "signalforge") {
    navigation.push({
      label: "Trace hub (SignalForge alert entity id)",
      href: operatorTraceHubPathForAlert(alertId),
      qualifierNote:
        "Unified operator trace view for this alert id — not a W3C trace thread id.",
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

  const dt = d.decisionType?.trim();
  if (dt) {
    navigation.push({
      label: "Decisions list (same decisionType)",
      href: decisionsListPath({ decisionType: dt, page: 1, pageSize: 50 }),
      qualifierNote: "Filtered list in ControlPlane — same type string from this row.",
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

  const traceIdentifiers: DecisionInsightTraceIdentifierRow[] = [
    {
      label: "traceId (distributed trace thread)",
      value: formatGuidOrString(d.trace.traceId),
      note: "Often absent unless gateways propagate trace context.",
    },
    {
      label: "correlationId (API field — SignalForge signal entity id)",
      value: formatGuidOrString(d.trace.correlationId),
    },
    {
      label: "executionId (API field — SignalForge alert entity id)",
      value: formatGuidOrString(d.trace.executionId),
      note: "Legacy JSON name; not ChronoFlow execution instance id.",
    },
    {
      label: "signalEntityId (explicit)",
      value: formatGuidOrString(d.trace.signalEntityId),
    },
    {
      label: "alertEntityId (explicit)",
      value: formatGuidOrString(d.trace.alertEntityId),
    },
    {
      label: "chronoFlowExecutionInstanceId",
      value: formatGuidOrString(d.trace.chronoFlowExecutionInstanceId),
    },
    {
      label: "executionInstanceId (A.I.L. invocation)",
      value: formatGuidOrString(d.trace.executionInstanceId),
      note: "Distinct from legacy executionId semantics.",
    },
  ];

  const related =
    d.trace.relatedEntityIds
      ?.map((x) => formatGuidOrString(x))
      .filter((x): x is string => Boolean(x)) ?? [];
  if (related.length) {
    traceIdentifiers.push({
      label: "relatedEntityIds",
      value: related.join(", "),
      note: "Opaque related domain ids as returned by the API — not reinterpreted in ControlPlane.",
    });
  }

  return {
    traceSemantics,
    outcome: {
      decisionType: d.decisionType,
      decisionCategory: d.decisionCategory,
      status: d.status,
      occurredAtUtc: d.occurredAtUtc,
      decisionId: d.decisionId,
      resultSummary: d.output?.resultSummary?.trim() || "—",
      selectedOption: buildSelectedOptionVm(d),
    },
    traceIdentifiers,
    insightSummary: {
      explanationAvailable: d.explanation.explanationAvailable,
      summaryText,
      reasonCodes: d.explanation.reasonCodes,
      recommendedDownstream: d.recommendedDownstreamSummary?.trim() || null,
      stateBadges: buildStateBadges(d),
      operatorLines: buildOperatorInsightLines(d),
    },
    influences,
    alternatives: buildAlternativesVm(d),
    debug: {
      confidenceBand: d.explanation.confidenceBand,
      fallbackUsageCount: d.explanation.fallbackUsageCount,
      retryUsageCount: d.explanation.retryUsageCount,
      reliabilityFallbackUsed: debugReliability ? debugReliability.fallbackUsed : null,
      reliabilitySummaryLines,
      safeErrorSummary: ext?.safeErrorSummary?.trim() || null,
      timeline: buildDebugTimeline(d),
    },
    missing,
    navigation,
  };
}
