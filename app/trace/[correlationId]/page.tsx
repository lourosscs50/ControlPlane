import Link from "next/link";
import { notFound } from "next/navigation";
import { DecisionTable } from "@/components/decisions/DecisionTable";
import { TraceIdentifier } from "@/components/operator/TraceIdentifier";
import { CrossSystemTimeline } from "@/components/trace/CrossSystemTimeline";
import { ErrorState } from "@/components/operator/ErrorState";
import { StatusBadge } from "@/components/operator/StatusBadge";
import { getExecutionById, listExecutions } from "@/lib/api/chronoflow";
import { getAlertDetail, listDecisions } from "@/lib/api/signalforge";
import { getAilObservabilityNote, listAilExecutionDecisions } from "@/lib/api/ail";
import type { DecisionVisibilityResponse } from "@/lib/api/decision-visibility";
import { getAilConfig, getChronoFlowConfig, getSignalForgeConfig } from "@/lib/env";
import { tracePath } from "@/lib/correlation";
import {
  decisionsListForAlertEntity,
  decisionsListForSignalEntity,
} from "@/lib/identifiers/signalforge-decisions";
import { executionDetailPath } from "@/lib/routes/operator";
import { getOperatorStatus } from "@/lib/operator/execution-status";
import { buildCrossSystemTimeline } from "@/lib/trace/build-timeline";
import { isUuid } from "@/lib/operator/dashboard-params";

type PageProps = {
  params: Promise<{ correlationId: string }>;
};

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised/50 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function formatIso(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "full",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

export default async function CrossSystemTracePage({ params }: PageProps) {
  const { correlationId: raw } = await params;
  const correlationId = decodeURIComponent(raw).trim();
  if (!correlationId) notFound();

  const { baseUrl: cfBase } = getChronoFlowConfig();
  if (!cfBase) {
    return (
      <div>
        <BackBar correlationId={correlationId} />
        <ErrorState
          title="Configuration error"
          error={new Error("CHRONOFLOW_API_BASE_URL is not configured.")}
        />
      </div>
    );
  }

  let executions: Awaited<ReturnType<typeof listExecutions>> = [];
  let signalForgeAlertId = correlationId;
  let cfError: unknown = null;
  try {
    if (isUuid(correlationId)) {
      const byExec = await getExecutionById(correlationId);
      if (byExec) {
        executions = [byExec];
        signalForgeAlertId = byExec.alertId;
      } else {
        executions = await listExecutions({
          alertId: correlationId,
          take: 100,
          skip: 0,
        });
        signalForgeAlertId = correlationId;
      }
    } else {
      executions = await listExecutions({
        alertId: correlationId,
        take: 100,
        skip: 0,
      });
      signalForgeAlertId = correlationId;
    }
  } catch (e) {
    cfError = e;
  }

  if (cfError) {
    return (
      <div>
        <BackBar correlationId={correlationId} />
        <ErrorState title="Failed to load ChronoFlow executions" error={cfError} />
      </div>
    );
  }

  const sfCfg = getSignalForgeConfig();
  const { baseUrl: sfBase } = sfCfg;
  let alertDetail: Awaited<ReturnType<typeof getAlertDetail>> = null;
  let sfError: unknown = null;
  if (sfBase) {
    try {
      alertDetail = await getAlertDetail(signalForgeAlertId);
    } catch (e) {
      sfError = e;
    }
  }

  let decisionRows: DecisionVisibilityResponse[] = [];
  if (sfBase && sfCfg.apiToken) {
    try {
      const decPage = await listDecisions({
        executionId: signalForgeAlertId,
        pageSize: 100,
        page: 1,
      });
      decisionRows = decPage?.items ?? [];
    } catch {
      decisionRows = [];
    }
  }

  let ailLinkedDecisions: DecisionVisibilityResponse[] = [];
  const ailCfg = getAilConfig();
  if (ailCfg.baseUrl) {
    try {
      const ailPage = await listAilExecutionDecisions(1, 100);
      const items = ailPage?.items ?? [];
      const execIds = new Set(executions.map((e) => e.id));
      ailLinkedDecisions = items.filter((d) => {
        const cf = d.trace.chronoFlowExecutionInstanceId?.trim();
        return Boolean(cf && execIds.has(cf));
      });
    } catch {
      ailLinkedDecisions = [];
    }
  }

  const timeline = buildCrossSystemTimeline(
    executions,
    alertDetail,
    decisionRows,
    ailLinkedDecisions
  );
  const primaryExecution = executions[0] ?? null;

  return (
    <div>
      <BackBar correlationId={correlationId} />

      <header className="mt-4 border-b border-surface-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cross-system trace
        </p>
        <div className="mt-3 max-w-3xl">
          <TraceIdentifier correlationId={signalForgeAlertId} />
          {correlationId !== signalForgeAlertId ? (
            <p className="mt-4 text-xs text-slate-500">
              Opened with execution id{" "}
              <code className="break-all text-slate-400">{correlationId}</code>
              . Correlation above is the alert id from that execution.
            </p>
          ) : null}
        </div>
        <p className="mt-4 max-w-3xl text-sm text-slate-400">
          This page is keyed by the <strong className="font-medium text-slate-300">SignalForge alert entity id</strong>{" "}
          (same as ChronoFlow <code className="text-slate-300">alertId</code>). It is a read-only
          <strong className="font-medium text-slate-300"> trace hub</strong>, not a W3C trace id.
          The primary view is one merged timeline; supporting panels below group the same read models
          by system.
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-surface-border bg-surface-raised/40 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Unified cross-system timeline
        </h2>
        <p className="mt-3 max-w-3xl text-xs text-slate-500">
          Events are ordered by each record&apos;s own timestamp. Rows appear only when the upstream
          read model includes them for this alert or execution context. A.I.L. execution visibility
          is included only when <code className="text-slate-400">chronoFlowExecutionInstanceId</code>{" "}
          on the A.I.L. decision envelope matches a ChronoFlow execution listed here (explicit link —
          nothing inferred from alert id alone).
        </p>
        <div className="mt-6">
          <CrossSystemTimeline events={timeline} />
        </div>
      </section>

      <details className="mt-10 rounded-xl border border-surface-border bg-surface-raised/30 open:bg-surface-raised/40">
        <summary className="cursor-pointer select-none px-5 py-4 text-sm font-medium text-slate-300 hover:text-white">
          Supporting context by system (A–E)
        </summary>
        <div className="border-t border-surface-border px-5 pb-6 pt-2">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="A — Execution (ChronoFlow)">
          {!executions.length ? (
            <p className="text-sm text-slate-500">
              No executions returned for this correlation. If you opened an execution id
              directly, that id is listed below; otherwise verify the alert id.
            </p>
          ) : (
            <ul className="space-y-4">
              {executions.map((ex) => {
                const st = getOperatorStatus(ex);
                return (
                  <li
                    key={ex.id}
                    className="rounded-lg border border-surface-border bg-black/20 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={executionDetailPath(ex.id)}
                        className="font-mono text-sm text-accent-muted hover:text-white"
                      >
                        {ex.id}
                      </Link>
                      <StatusBadge status={st} />
                    </div>
                    <dl className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                      <div>
                        <dt className="text-slate-500">Received</dt>
                        <dd className="font-mono text-slate-300">
                          {formatIso(ex.receivedAtUtc)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Executed</dt>
                        <dd className="font-mono text-slate-300">
                          {formatIso(ex.executedAtUtc)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Lifecycle</dt>
                        <dd className="text-slate-200">{ex.lifecycleEventType}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Status</dt>
                        <dd className="text-slate-200">{ex.currentStatus}</dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="B — Signal (SignalForge)">
          {!sfBase ? (
            <p className="text-sm text-slate-500">
              Configure <code className="rounded bg-black/30 px-1">SIGNALFORGE_API_BASE_URL</code>{" "}
              to load signal context.
            </p>
          ) : sfError ? (
            <ErrorState title="SignalForge signal section failed" error={sfError} />
          ) : !alertDetail ? (
            <p className="text-sm text-slate-500">
              No alert detail for this id (404) — signal data unavailable.
            </p>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
                <dt className="text-slate-500">Type</dt>
                <dd className="font-mono text-slate-200">
                  {alertDetail.signal.type}
                </dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
                <dt className="text-slate-500">Source</dt>
                <dd className="font-mono text-slate-200">
                  {alertDetail.signal.source}
                </dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
                <dt className="text-slate-500">Occurred (UTC)</dt>
                <dd className="font-mono text-slate-300">
                  {formatIso(alertDetail.signal.occurredAtUtc)}
                </dd>
              </div>
            </dl>
          )}
          {sfBase && sfCfg.apiToken && alertDetail ? (
            <p className="mt-4 text-xs">
              <Link
                className="text-accent-muted hover:text-white"
                href={decisionsListForSignalEntity(alertDetail.signal.id)}
              >
                Decisions for this signal id
              </Link>
            </p>
          ) : null}
        </Panel>

        <Panel title="C — Alert (SignalForge)">
          {!sfBase ? (
            <p className="text-sm text-slate-500">
              Configure SignalForge base URL for alert rule context.
            </p>
          ) : sfError ? (
            <p className="text-sm text-slate-500">
              See error in signal section — alert details not loaded.
            </p>
          ) : !alertDetail ? (
            <p className="text-sm text-slate-500">No alert for this correlation.</p>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-slate-500">Rule name</dt>
                <dd className="text-slate-200">{alertDetail.rule.name}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-slate-500">Match value</dt>
                <dd className="font-mono text-slate-300">
                  {alertDetail.rule.matchValue}
                </dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-slate-500">Acknowledged</dt>
                <dd className="text-slate-200">
                  {alertDetail.isAcknowledged ? "Yes" : "No"}
                </dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-slate-500">Resolved</dt>
                <dd className="text-slate-200">
                  {alertDetail.isResolved ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
          )}
        </Panel>

        <Panel title="D — Decisions (SignalForge)">
          {!sfBase ? (
            <p className="text-sm text-slate-500">
              Configure SignalForge base URL to load decision visibility.
            </p>
          ) : !sfCfg.apiToken ? (
            <p className="text-sm text-slate-500">
              Set{" "}
              <code className="rounded bg-black/30 px-1">SIGNALFORGE_API_TOKEN</code>{" "}
              to list decisions for this alert id.
            </p>
          ) : (
            <>
              <p className="mb-4 text-xs text-slate-500">
                Rows where SignalForge filter param{" "}
                <code className="text-slate-400">executionId</code> equals this{" "}
                <strong className="text-slate-400">alert entity id</strong> (not
                ChronoFlow execution id).{" "}
                <Link
                  className="text-accent-muted hover:text-white"
                  href={decisionsListForAlertEntity(signalForgeAlertId)}
                >
                  Open filtered list
                </Link>
                {" · "}
                <Link className="text-accent-muted hover:text-white" href="/decisions">
                  All decisions
                </Link>
              </p>
              <DecisionTable
                rows={decisionRows.map((visibility) => ({
                  sourceSystem: "signalforge" as const,
                  visibility,
                }))}
                compact
              />
            </>
          )}
        </Panel>

        <Panel title="E — A.I.L. advisory (safe fields)">
          <p className="text-xs text-slate-500">{getAilObservabilityNote()}</p>
          {primaryExecution && primaryExecution.advisoryWasUsed ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-slate-500">Strategy (snapshot)</dt>
                <dd className="text-slate-200">
                  {primaryExecution.advisoryStrategyKey ?? "—"}
                </dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-slate-500">Confidence</dt>
                <dd className="text-slate-200">
                  {primaryExecution.advisoryConfidence ?? "—"}
                </dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-slate-500">Reason summary</dt>
                <dd className="break-words text-slate-300">
                  {primaryExecution.advisoryReasonSummary ?? "—"}
                </dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-slate-500">Provider / model</dt>
                <dd className="text-slate-400">
                  Not exposed on ChronoFlow execution records — configure a read-only
                  A.I.L. observability API only if your deployment provides one.
                </dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-slate-500">Fallback usage</dt>
                <dd className="text-slate-400">
                  Not available in ControlPlane without an explicit advisory audit
                  feed; execution shows only the applied snapshot above.
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              {primaryExecution
                ? "Advisory was not recorded for the primary execution in this correlation."
                : "No execution row to show advisory snapshot."}
            </p>
          )}
        </Panel>
      </div>
        </div>
      </details>
    </div>
  );
}

function BackBar({ correlationId }: { correlationId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <Link
        href="/"
        className="font-medium text-accent-muted hover:text-white"
      >
        ← Executions
      </Link>
      <span className="text-slate-600">|</span>
      <Link
        href={tracePath(correlationId)}
        className="font-mono text-xs text-slate-500"
      >
        Refresh trace
      </Link>
      <span className="text-slate-600">|</span>
      <Link href="/trace" className="text-slate-500 hover:text-white">
        Trace lookup
      </Link>
    </div>
  );
}
