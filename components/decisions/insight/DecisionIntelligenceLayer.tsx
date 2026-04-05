import type { DecisionVisibilityResponse } from "@/lib/api/decision-visibility";
import { buildDecisionInsightViewModel } from "@/lib/operator/decision-insight-model";
import type { DecisionTraceSemantics } from "@/lib/operator/decision-trace-semantics";
import { DecisionAlternativesSection } from "./DecisionAlternativesSection";
import { DecisionCrossSystemNav } from "./DecisionCrossSystemNav";
import { DecisionDebugStatusSection } from "./DecisionDebugStatusSection";
import { DecisionInfluencesSection } from "./DecisionInfluencesSection";
import { DecisionInsightSummaryCard } from "./DecisionInsightSummaryCard";
import { DecisionMissingDataPanel } from "./DecisionMissingDataPanel";
import { DecisionOutcomeCard } from "./DecisionOutcomeCard";

/**
 * Read-only operator intelligence stack for a single decision visibility row.
 */
export function DecisionIntelligenceLayer({
  d,
  traceSemantics,
}: {
  d: DecisionVisibilityResponse;
  traceSemantics: DecisionTraceSemantics;
}) {
  const vm = buildDecisionInsightViewModel(d, traceSemantics);

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <DecisionOutcomeCard outcome={vm.outcome} />
        <DecisionInsightSummaryCard insight={vm.insightSummary} />
      </div>
      <DecisionInfluencesSection influences={vm.influences} />
      <DecisionAlternativesSection alternatives={vm.alternatives} />
      <DecisionDebugStatusSection debug={vm.debug} />
      <DecisionMissingDataPanel items={vm.missing} />
      <DecisionCrossSystemNav links={vm.navigation} />
    </div>
  );
}
