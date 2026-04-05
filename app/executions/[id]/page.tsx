import Link from "next/link";
import { notFound } from "next/navigation";
import { DecisionTable } from "@/components/decisions/DecisionTable";
import { AdvisoryBadge } from "@/components/operator/AdvisoryBadge";
import { CopyableId } from "@/components/operator/CopyableId";
import { TraceIdentifier } from "@/components/operator/TraceIdentifier";
import { EmptyStateNotice } from "@/components/operator/EmptyStateNotice";
import { ErrorState } from "@/components/operator/ErrorState";
import { OperatorPanel } from "@/components/operator/OperatorPanel";
import { StatusBadge } from "@/components/operator/StatusBadge";
import type { DecisionVisibilityResponse } from "@/lib/api/decision-visibility";
import { ChronoFlowApiError, getExecutionById } from "@/lib/api/chronoflow";
import { listDecisions } from "@/lib/api/signalforge";
import { getChronoFlowConfig, getSignalForgeConfig } from "@/lib/env";
import { decisionsListPath } from "@/lib/routes/operator";
import { getOperatorStatus } from "@/lib/operator/execution-status";
import { tracePath } from "@/lib/correlation";
import { safeDashboardReturn } from "@/lib/operator/safe-return";
import type { ControlExecutionRecord } from "@/lib/chronoflow/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatIso(iso: string | null) {
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-baseline">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="break-words font-mono text-sm text-slate-200 whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}

function RawPayload({ row }: { row: ControlExecutionRecord }) {
  const json = JSON.stringify(row, null, 2);
  return (
    <details className="rounded-lg border border-surface-border bg-black/30">
      <summary className="cursor-pointer px-4 py-2 text-sm text-slate-400">
        Raw record (JSON)
      </summary>
      <pre className="max-h-72 overflow-auto border-t border-surface-border p-4 text-xs text-slate-400">
        {json}
      </pre>
    </details>
  );
}

function Timeline({ row }: { row: ControlExecutionRecord }) {
  const received = new Date(row.receivedAtUtc).getTime();
  const executed = row.executedAtUtc
    ? new Date(row.executedAtUtc).getTime()
    : null;
  const dur =
    executed !== null && Number.isFinite(executed) && Number.isFinite(received)
      ? `${Math.max(0, executed - received)} ms`
      : "—";

  return (
    <div className="relative pl-4">
      <div className="absolute bottom-2 left-0 top-2 w-px bg-slate-700" />
      <ol className="space-y-6">
        <li className="relative">
          <span className="absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-surface-raised" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Received
          </p>
          <p className="mt-1 text-sm text-slate-200">
            {formatIso(row.receivedAtUtc)}
          </p>
        </li>
        <li className="relative">
          <span
            className={`absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full ring-4 ring-surface-raised ${
              row.executedAtUtc ? "bg-emerald-500" : "bg-slate-600"
            }`}
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Executed
          </p>
          <p className="mt-1 text-sm text-slate-200">
            {formatIso(row.executedAtUtc)}
          </p>
        </li>
        <li className="relative">
          <span className="absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full bg-slate-500 ring-4 ring-surface-raised" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Intake → run duration
          </p>
          <p className="mt-1 font-mono text-sm text-slate-300">{dur}</p>
        </li>
      </ol>
    </div>
  );
}

export default async function ExecutionDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const returnToRaw =
    typeof sp.returnTo === "string" ? sp.returnTo : undefined;
  const backHref = safeDashboardReturn(returnToRaw);

  const { baseUrl } = getChronoFlowConfig();

  if (!baseUrl) {
    return (
      <div>
        <BackLink href={backHref} />
        <div className="mt-6">
          <ErrorState
            title="Configuration error"
            error={
              new ChronoFlowApiError("CHRONOFLOW_API_BASE_URL is not configured.", 0)
            }
          />
        </div>
      </div>
    );
  }

  let row: ControlExecutionRecord | null = null;
  let error: unknown = null;
  try {
    row = await getExecutionById(id);
  } catch (e) {
    error = e;
  }

  if (error) {
    return (
      <div>
        <BackLink href={backHref} />
        <div className="mt-6">
          <ErrorState title="Failed to load execution" error={error} />
        </div>
      </div>
    );
  }

  if (!row) notFound();

  const status = getOperatorStatus(row);

  const sfCfg = getSignalForgeConfig();
  let relatedDecisions: DecisionVisibilityResponse[] = [];
  let relatedDecisionsError: unknown = null;
  if (sfCfg.baseUrl && sfCfg.apiToken) {
    try {
      const decPage = await listDecisions({
        executionId: row.alertId,
        pageSize: 50,
        page: 1,
      });
      relatedDecisions = decPage?.items ?? [];
    } catch (e) {
      relatedDecisionsError = e;
    }
  }

  return (
    <div>
      <BackLink href={backHref} />

      <header className="mt-4 border-b border-surface-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Execution detail
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">
            {row.lifecycleEventType}
          </h1>
          <StatusBadge status={status} />
          <AdvisoryBadge advisoryWasUsed={row.advisoryWasUsed} />
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <OperatorPanel title="Overview">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={tracePath(row.alertId)}
                className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-accent-muted hover:border-accent-muted hover:text-white"
              >
                Trace hub (alert id)
              </Link>
            </div>
            <div className="space-y-3">
              <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-baseline">
                <div className="text-sm text-slate-500">Execution id</div>
                <CopyableId
                  value={row.id}
                  copyLabel="Copy execution id"
                />
              </div>
              <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start">
                <div className="text-sm text-slate-500 pt-0.5">Trace key</div>
                <TraceIdentifier
                  correlationId={row.alertId}
                  showLabel={false}
                />
              </div>
              <Field label="Trigger type" value={row.triggerType} />
              <Field
                label="Workflow key"
                value={row.workflowKey ?? "—"}
              />
              <Field
                label="Steps executed"
                value={String(row.executedStepCount)}
              />
              <Field label="Current status" value={row.currentStatus} />
              <Field label="Rule id" value={row.ruleId} />
              <Field label="Signal id" value={row.signalId} />
            </div>
          </div>
        </OperatorPanel>

        <OperatorPanel title="Timeline">
          <Timeline row={row} />
        </OperatorPanel>

        <OperatorPanel title="Suppression">
          {row.wasSuppressed ? (
            <p className="text-sm text-amber-200">
              {row.suppressionReason ?? "Suppressed (no reason text)"}
            </p>
          ) : (
            <p className="text-sm text-slate-500">Not suppressed.</p>
          )}
        </OperatorPanel>

        <OperatorPanel title="AIL advisory">
          {row.advisoryWasUsed ? (
            <div className="space-y-3">
              <Field
                label="Strategy key"
                value={row.advisoryStrategyKey ?? "—"}
              />
              <Field
                label="Confidence"
                value={row.advisoryConfidence ?? "—"}
              />
              <Field
                label="Reason summary"
                value={row.advisoryReasonSummary ?? "—"}
              />
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Advisory was not applied for this record.
            </p>
          )}
        </OperatorPanel>
      </div>

      <div className="mt-8">
        <OperatorPanel title="A.I.L. execution visibility">
          <p className="text-sm text-slate-400">
            The ChronoFlow execution id above is <strong className="text-slate-300">not</strong>{" "}
            the A.I.L. execution instance id. Do not infer A.I.L. identifiers from this page.
            Use the real instance id returned by{" "}
            <code className="text-slate-300">execute-intelligence</code> (header{" "}
            <code className="text-slate-300">X-Ail-Execution-Instance-Id</code>) or operator
            tooling.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-400">
            <li>
              <Link
                className="text-accent-muted hover:text-white"
                href={decisionsListPath({ sourceSystem: "ail", page: 1, pageSize: 50 })}
              >
                Unified decisions list (A.I.L. source)
              </Link>
            </li>
            <li>
              Direct read-only detail route when you have the id:{" "}
              <code className="text-slate-300">
                /ail/executions/&lt;A.I.L. execution instance id&gt;
              </code>
            </li>
          </ul>
        </OperatorPanel>
      </div>

      <div className="mt-8">
        <OperatorPanel title="Related SignalForge decisions" tone="related">
          {!sfCfg.baseUrl ? (
            <EmptyStateNotice variant="not_configured">
              Set{" "}
              <code className="rounded bg-black/30 px-1">SIGNALFORGE_API_BASE_URL</code> to load
              decision visibility from SignalForge.
            </EmptyStateNotice>
          ) : !sfCfg.apiToken ? (
            <EmptyStateNotice variant="not_configured">
              Set{" "}
              <code className="rounded bg-black/30 px-1">SIGNALFORGE_API_TOKEN</code> for{" "}
              <code className="rounded bg-black/30 px-1">GET /decisions</code> (filtered by this
              execution&apos;s alert entity id as <code className="text-amber-100/90">executionId</code>
              ).
            </EmptyStateNotice>
          ) : relatedDecisionsError ? (
            <EmptyStateNotice variant="source_unavailable">
              The SignalForge request failed; this is not the same as an empty result set.
              <span className="mt-2 block font-mono text-xs opacity-90">
                {String(relatedDecisionsError)}
              </span>
            </EmptyStateNotice>
          ) : relatedDecisions.length === 0 ? (
            <EmptyStateNotice variant="no_results_found">
              No related entities found — SignalForge returned no decision rows for alert id{" "}
              <code className="text-sky-100/90">{row.alertId}</code> (filter{" "}
              <code className="text-sky-100/90">executionId</code>). The request succeeded; this is
              not a configuration or availability failure.
            </EmptyStateNotice>
          ) : (
            <>
              <p className="mb-4 text-xs text-slate-500">
                Matched on SignalForge filter{" "}
                <code className="text-slate-400">executionId</code> = this execution&apos;s{" "}
                <strong className="text-slate-400">alert entity id</strong> (not ChronoFlow
                execution id). Summaries only — no prompts or raw payloads.
              </p>
              <DecisionTable
                rows={relatedDecisions.map((visibility) => ({
                  sourceSystem: "signalforge" as const,
                  visibility,
                }))}
                compact
              />
            </>
          )}
        </OperatorPanel>
      </div>

      <div className="mt-8">
        <OperatorPanel title="Diagnostics">
          <RawPayload row={row} />
        </OperatorPanel>
      </div>
    </div>
  );
}

function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-sm font-medium text-accent-muted hover:text-white"
    >
      ← Back to dashboard
    </Link>
  );
}
