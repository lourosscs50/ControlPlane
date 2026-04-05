import { notFound } from "next/navigation";
import { AilExecutionExtensionPanel } from "@/components/decisions/AilExecutionExtensionPanel";
import { DecisionIntelligenceLayer } from "@/components/decisions/insight/DecisionIntelligenceLayer";
import { DecisionVisibilityPanels } from "@/components/decisions/DecisionVisibilityPanels";
import { ErrorState } from "@/components/operator/ErrorState";
import { getAilExecutionDecisionVisibility } from "@/lib/api/ail";
import type { DecisionVisibilityResponse } from "@/lib/api/decision-visibility";
import {
  listDecisions as listSignalForgeDecisions,
  type PagedResult,
} from "@/lib/api/signalforge";
import { getAilConfig, getSignalForgeConfig } from "@/lib/env";

import Link from "next/link";
import { CopyableId } from "@/components/operator/CopyableId";
import { EmptyStateNotice } from "@/components/operator/EmptyStateNotice";
import { OperatorPanel } from "@/components/operator/OperatorPanel";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AilExecutionVisibilityPage({ params }: PageProps) {
  const { id } = await params;
  const { baseUrl } = getAilConfig();

  if (!baseUrl) {
    return (
      <div>
        <BackLink />
        <div className="mt-6">
          <ErrorState
            title="Configuration error"
            error={new Error("AIL_API_BASE_URL is not configured.")}
          />
        </div>
      </div>
    );
  }

  let detail: Awaited<ReturnType<typeof getAilExecutionDecisionVisibility>> = null;
  let error: unknown = null;
  try {
    detail = await getAilExecutionDecisionVisibility(id);
  } catch (e) {
    error = e;
  }

  if (error) {
    return (
      <div>
        <BackLink />
        <div className="mt-6">
          <ErrorState title="Failed to load A.I.L. execution visibility" error={error} />
        </div>
      </div>
    );
  }

  if (!detail) notFound();

  const d = detail;

  const sfCfg = getSignalForgeConfig();
  let relatedPage: PagedResult<DecisionVisibilityResponse> | null = null;
  let relatedError: unknown = null;
  const traceId = d.trace?.traceId?.trim() || null;
  if (traceId && sfCfg.baseUrl && sfCfg.apiToken) {
    try {
      relatedPage = await listSignalForgeDecisions({ traceId, page: 1, pageSize: 20 });
    } catch (e) {
      relatedError = e;
    }
  }

  return (
    <div>
      <BackLink />

      <header className="mt-4 border-b border-surface-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          A.I.L. execution visibility
        </p>
        <h1 className="mt-2 break-all font-mono text-xl text-white sm:text-2xl">
          {d.decisionType}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {d.decisionCategory} · read-only snapshot from{" "}
          <code className="text-slate-400">GET /executions/{"{id}"}</code>
        </p>
        <p className="mt-3 max-w-3xl text-xs text-slate-600">
          Operator intelligence below is read-only: it mirrors the visibility API. Core systems
          own decisions; A.I.L. advises where wired — ControlPlane does not re-score or reinterpret
          outcomes.
        </p>
      </header>

      <DecisionIntelligenceLayer d={d} traceSemantics="ail" />

      {d.executionExtension ? (
        <div className="mt-8">
          <AilExecutionExtensionPanel ext={d.executionExtension} />
        </div>
      ) : null}

      <details className="mt-10 rounded-xl border border-surface-border bg-surface-raised/30">
        <summary className="cursor-pointer select-none px-5 py-4 text-sm font-medium text-slate-400 hover:text-white">
          Full visibility record (reference)
        </summary>
        <div className="border-t border-surface-border px-5 pb-6">
          <DecisionVisibilityPanels d={d} traceSemantics="ail" />
        </div>
      </details>

      <div className="mt-8">
        <OperatorPanel title="Related SignalForge decisions" tone="related">
          {!traceId ? (
            <EmptyStateNotice variant="no_trace_id">
              This A.I.L. execution visibility row has no <code className="text-slate-400">traceId</code>
              , so ControlPlane cannot query SignalForge by trace thread. This is not the same as
              &quot;no decisions exist.&quot;
            </EmptyStateNotice>
          ) : !sfCfg.baseUrl || !sfCfg.apiToken ? (
            <EmptyStateNotice variant="not_configured">
              Set <code className="rounded bg-black/30 px-1">SIGNALFORGE_API_BASE_URL</code> and{" "}
              <code className="rounded bg-black/30 px-1">SIGNALFORGE_API_TOKEN</code> to load
              decisions filtered by <code className="text-slate-200">traceId</code>.
            </EmptyStateNotice>
          ) : relatedError ? (
            <EmptyStateNotice variant="source_unavailable">
              The SignalForge request failed; details below. This is not the same as an empty result
              set.
              <span className="mt-2 block font-mono text-xs opacity-90">{String(relatedError)}</span>
            </EmptyStateNotice>
          ) : !relatedPage?.items.length ? (
            <EmptyStateNotice variant="no_results_found">
              No related entities found for this trace identifier — the SignalForge query succeeded
              but returned no decision rows for this trace thread.
            </EmptyStateNotice>
          ) : (
            <ul className="space-y-3">
              {relatedPage.items.map((sf) => (
                <li
                  key={sf.decisionId}
                  className="rounded-lg border border-surface-border/80 bg-black/15 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <CopyableId
                      value={sf.decisionId}
                      copyLabel="Copy decision id"
                      href={`/decisions/${encodeURIComponent(sf.decisionId)}`}
                    />
                    {sf.decisionType && (
                      <span className="text-xs text-slate-500">{sf.decisionType}</span>
                    )}
                    {sf.explanation?.summaryText && (
                      <span className="text-xs text-slate-400 ml-2 line-clamp-2">
                        {sf.explanation.summaryText}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OperatorPanel>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center text-sm font-medium text-accent-muted hover:text-white"
    >
      ← Home
    </Link>
  );
}
